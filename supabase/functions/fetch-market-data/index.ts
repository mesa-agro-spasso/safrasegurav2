// fetch-market-data — Edge Function
// Fetches futures prices and USD/BRL spot from Yahoo Finance via HTTP
// Faithfully reproduces yfinance_fetcher.py behavior in TypeScript

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ── CORS ─────────────────────────────────────────────────────────────────
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ══════════════════════════════════════════════════════════════════════════
//  TICKER UTILS — ported from TickerUtils in utils.py
// ══════════════════════════════════════════════════════════════════════════

const COMMODITY_CONFIG: Record<string, { tickerRoot: string; contractMonths: Record<number, string> }> = {
  soybean: {
    tickerRoot: "ZS",
    contractMonths: { 1: "F", 3: "H", 5: "K", 7: "N", 8: "Q", 9: "U", 11: "X" },
  },
  corn: {
    tickerRoot: "ZC",
    contractMonths: { 3: "H", 5: "K", 7: "N", 9: "U", 12: "Z" },
  },
  corn_b3: {
    tickerRoot: "CCM",
    contractMonths: { 1: "F", 3: "H", 5: "K", 7: "N", 9: "U", 11: "X" },
  },
};

// Reverse maps: month_code -> month_number per commodity
const MONTH_CODE_TO_NUMBER: Record<string, Record<string, number>> = {};
for (const [commodity, cfg] of Object.entries(COMMODITY_CONFIG)) {
  MONTH_CODE_TO_NUMBER[commodity] = {};
  for (const [monthStr, code] of Object.entries(cfg.contractMonths)) {
    MONTH_CODE_TO_NUMBER[commodity][code] = Number(monthStr);
  }
}

// Yahoo Finance suffix per commodity
const YF_SUFFIX: Record<string, string> = {
  soybean: ".CBT",
  corn: ".CBT",
  corn_b3: ".SA", // B3 tickers on Yahoo use .SA
};

/**
 * Generate upcoming futures tickers for a commodity.
 * Reproduces TickerUtils.generate_futures_tickers from Python.
 */
function generateFuturesTickers(
  commodity: string,
  quantity: number,
  referenceDate?: Date,
  cutoffDay = 1,
): string[] {
  const cfg = COMMODITY_CONFIG[commodity];
  if (!cfg) {
    throw new Error(`Unsupported commodity '${commodity}'. Valid: ${Object.keys(COMMODITY_CONFIG).join(", ")}`);
  }

  const dt = referenceDate || new Date();
  let year = dt.getFullYear();
  let month = dt.getMonth() + 1; // 1-based
  const tickers: string[] = [];

  while (tickers.length < quantity) {
    const monthCode = cfg.contractMonths[month];
    if (monthCode) {
      const isCurrentMonth = year === dt.getFullYear() && month === dt.getMonth() + 1;
      if (!(isCurrentMonth && dt.getDate() > cutoffDay)) {
        const yearSuffix = String(year).slice(-2);
        tickers.push(`${cfg.tickerRoot}${monthCode}${yearSuffix}`);
      }
    }
    month++;
    if (month > 12) {
      month = 1;
      year++;
    }
  }
  return tickers;
}

/**
 * Parse a CBOT/B3 futures ticker into components.
 * Reproduces TickerUtils.parse_cbot_ticker from Python.
 */
function parseTicker(
  ticker: string,
  commodity?: string,
): { root: string; year: number; month: number; commodity: string } | null {
  if (ticker.length < 4) return null;

  const monthCode = ticker[ticker.length - 3];
  const yearSuffix = ticker.slice(-2);
  const root = ticker.slice(0, -3);

  if (!/^\d{2}$/.test(yearSuffix)) return null;

  let resolved = commodity || null;
  if (!resolved) {
    for (const [comm, cfg] of Object.entries(COMMODITY_CONFIG)) {
      if (cfg.tickerRoot === root) {
        resolved = comm;
        break;
      }
    }
  }
  if (!resolved) return null;

  const codeMap = MONTH_CODE_TO_NUMBER[resolved];
  if (!codeMap || !(monthCode in codeMap)) return null;

  return {
    root,
    year: 2000 + Number(yearSuffix),
    month: codeMap[monthCode],
    commodity: resolved,
  };
}

/**
 * Estimate CBOT expiration: business day before the 15th of the contract month.
 * Simplified version (no holiday calendar in Deno — uses weekday check).
 */
function estimateExpiration(ticker: string, commodity?: string): string | null {
  const parsed = parseTicker(ticker, commodity);
  if (!parsed) return null;

  // Start at the 15th and go back to find a weekday
  const d = new Date(parsed.year, parsed.month - 1, 15);
  // Go back one day (business day before 15th)
  d.setDate(d.getDate() - 1);
  // If weekend, go back further
  while (d.getDay() === 0 || d.getDay() === 6) {
    d.setDate(d.getDate() - 1);
  }
  return d.toISOString().split("T")[0];
}

// ══════════════════════════════════════════════════════════════════════════
//  YAHOO FINANCE CLIENT — HTTP-based, replaces yfinance Python lib
// ══════════════════════════════════════════════════════════════════════════

/**
 * Fetch a single quote from Yahoo Finance using the v8 chart API.
 * Returns the latest closing price or null.
 */
async function fetchYahooPrice(yfTicker: string): Promise<number | null> {
  const url = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yfTicker)}?range=5d&interval=1d`;

  try {
    const resp = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; SafraSegura/1.0)",
      },
    });

    if (!resp.ok) {
      console.warn(`Yahoo Finance HTTP ${resp.status} for ${yfTicker}`);
      return null;
    }

    const data = await resp.json();
    const result = data?.chart?.result?.[0];
    if (!result) return null;

    const closes: number[] | undefined =
      result.indicators?.quote?.[0]?.close;
    if (!closes || closes.length === 0) return null;

    // Return the last non-null close
    for (let i = closes.length - 1; i >= 0; i--) {
      if (closes[i] != null) return closes[i];
    }
    return null;
  } catch (err) {
    console.error(`Error fetching ${yfTicker}:`, err);
    return null;
  }
}

/**
 * Fetch USD/BRL spot rate.
 * Reproduces fetch_spot_usd_brl from yfinance_fetcher.py.
 */
async function fetchSpotUsdBrl(): Promise<number | null> {
  return fetchYahooPrice("BRL=X");
}

/**
 * Fetch futures prices for a list of tickers.
 * Reproduces fetch_futures_prices from yfinance_fetcher.py.
 */
async function fetchFuturesPrices(
  tickers: string[],
  commodity: string,
): Promise<Array<{ ticker: string; price: number | null; exp_date: string | null }>> {
  const suffix = YF_SUFFIX[commodity] || ".CBT";

  const results = await Promise.all(
    tickers.map(async (ticker) => {
      const yfTicker = `${ticker}${suffix}`;
      const price = await fetchYahooPrice(yfTicker);
      const expDate = estimateExpiration(ticker, commodity);
      return { ticker, price, exp_date: expDate };
    }),
  );

  return results;
}

/**
 * Build a complete futures table.
 * Reproduces build_futures_table from yfinance_fetcher.py.
 */
async function buildFuturesTable(
  commodity: string,
  quantity = 6,
  referenceDate?: Date,
  cutoffDay = 1,
): Promise<Array<{ ticker: string; price: number | null; exp_date: string | null }>> {
  const tickers = generateFuturesTickers(commodity, quantity, referenceDate, cutoffDay);
  const results = await fetchFuturesPrices(tickers, commodity);
  // Sort by exp_date
  results.sort((a, b) => (a.exp_date || "").localeCompare(b.exp_date || ""));
  return results;
}

// ══════════════════════════════════════════════════════════════════════════
//  EDGE FUNCTION HANDLER
// ══════════════════════════════════════════════════════════════════════════

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ── Auth check ───────────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getUser(token);
    if (claimsError || !claimsData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Parse input ──────────────────────────────────────────────────
    const body = await req.json();
    const {
      commodity,
      tickers: explicitTickers,
      quantity = 6,
      include_usd_brl = true,
      daily_table_param_id,
      cutoff_day = 1,
    } = body;

    if (!commodity || !["soybean", "corn", "corn_b3"].includes(commodity)) {
      return new Response(
        JSON.stringify({
          error: `Invalid or missing commodity. Valid: soybean, corn, corn_b3`,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── Fetch market data ────────────────────────────────────────────
    const fetchedAt = new Date().toISOString();

    // Futures prices
    let futures: Array<{ ticker: string; price: number | null; exp_date: string | null }>;
    if (explicitTickers && Array.isArray(explicitTickers) && explicitTickers.length > 0) {
      futures = await fetchFuturesPrices(explicitTickers, commodity);
    } else {
      futures = await buildFuturesTable(commodity, quantity, undefined, cutoff_day);
    }

    // USD/BRL spot
    let usdBrl: number | null = null;
    if (include_usd_brl) {
      usdBrl = await fetchSpotUsdBrl();
    }

    // ── Build response ───────────────────────────────────────────────
    const marketDataPayload = {
      commodity,
      usd_brl: usdBrl,
      futures: futures.map((f) => ({
        ticker: f.ticker,
        price: f.price,
        exp_date: f.exp_date,
      })),
      fetched_at: fetchedAt,
      source: "yahoo_finance",
    };

    // ── Optionally persist to daily_table_params ─────────────────────
    let persisted = false;
    if (daily_table_param_id) {
      // Read existing market_data to merge
      const { data: existingRow } = await supabase
        .from("daily_table_params")
        .select("market_data")
        .eq("id", daily_table_param_id)
        .single();

      const existingMarketData =
        existingRow?.market_data && typeof existingRow.market_data === "object"
          ? (existingRow.market_data as Record<string, unknown>)
          : {};

      // Build futures map keyed by ticker
      const futuresMap: Record<string, number | null> = {};
      for (const f of futures) {
        futuresMap[f.ticker] = f.price;
      }

      // Merge into existing market_data preserving other commodity data
      const updatedMarketData = {
        ...existingMarketData,
        usd_brl_spot: usdBrl ?? (existingMarketData as Record<string, unknown>).usd_brl_spot,
        [`${commodity}_futures`]: futuresMap,
        [`${commodity}_futures_detail`]: futures,
        updated_at: fetchedAt,
        source: "yahoo_finance",
      };

      const { error: updateError } = await supabase
        .from("daily_table_params")
        .update({ market_data: updatedMarketData, updated_at: fetchedAt })
        .eq("id", daily_table_param_id);

      if (updateError) {
        console.error("Error updating daily_table_params:", updateError);
      } else {
        persisted = true;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        ...marketDataPayload,
        persisted,
        daily_table_param_id: daily_table_param_id || null,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    console.error("fetch-market-data error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
