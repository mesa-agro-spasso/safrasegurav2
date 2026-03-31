import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

// =============================================================================
// CORS
// =============================================================================
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// =============================================================================
// HELPERS  (faithful port of helpers.py)
// =============================================================================

function toDate(value: string | Date): Date {
  if (value instanceof Date) return value;
  const parts = value.substring(0, 10).split("-");
  return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
}

function calculateDaysBetween(startDate: string | Date, endDate: string | Date): number {
  const s = toDate(startDate);
  const e = toDate(endDate);
  return Math.round(Math.abs(e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
}

// =============================================================================
// CONSTANTS  (faithful port of utils.py)
// =============================================================================

const SOYBEAN = { BUSHELS_PER_SACK: 2.20462, CONTRACT_SIZE_BUSHELS: 5000, ROUNDING_INCREMENT: 0.50 };
const CORN = { BUSHELS_PER_SACK: 2.3622, CONTRACT_SIZE_BUSHELS: 5000, ROUNDING_INCREMENT: 0.25, B3_SACKS_PER_CONTRACT: 450 };
const MAX_LOSS_UNLIMITED = 99_999_999.0;

// =============================================================================
// MATH UTILS
// =============================================================================

function roundTo(value: number, places: number): number {
  const f = Math.pow(10, places);
  return Math.round(value * f) / f;
}

function erf(x: number): number {
  const sign = x >= 0 ? 1 : -1;
  x = Math.abs(x);
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741, a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return sign * y;
}

function normCdf(x: number): number { return 0.5 * (1.0 + erf(x / Math.sqrt(2.0))); }

// =============================================================================
// AGRO UTILS  (faithful port of AgroUtils)
// =============================================================================

function applyPercentageSpread(value: number, spreadRate: number): number { return value * (1 + spreadRate); }

function calculateFinancialCost(startDate: string | Date, endDate: string | Date, interestRate: number, ratePeriod: string, baseValue: number, daysPerYear = 365.0): number {
  const days = (toDate(endDate).getTime() - toDate(startDate).getTime()) / (1000 * 60 * 60 * 24);
  const periods = ratePeriod === "monthly" ? days / 30.0 : ratePeriod === "yearly" ? days / daysPerYear : (() => { throw new Error(`Invalid rate_period '${ratePeriod}'`); })();
  return (Math.pow(1 + interestRate, periods) - 1) * baseValue;
}

function calculateStorageCost(storageCost: number, storageCostType: string, receptionCost: number, startDate: string | Date, endDate: string | Date, shrinkageRateMonthly = 0.0, shrinkageBaseValue = 0.0): number {
  const days = Math.max((toDate(endDate).getTime() - toDate(startDate).getTime()) / (1000 * 60 * 60 * 24), 0);
  const months = days / 30.0;
  let total = storageCostType === "monthly" ? storageCost * months + receptionCost : storageCostType === "fixed" ? storageCost + receptionCost : (() => { throw new Error(`Invalid storage_cost_type '${storageCostType}'`); })();
  if (shrinkageRateMonthly > 0.0) total += shrinkageRateMonthly * months * shrinkageBaseValue;
  return total;
}

function calculateOriginationPrice(exchangePrice: number, basis: number, costs: number): number { return roundTo(exchangePrice + basis - costs, 4); }
function calculateBrokerageCost(costPerContract: number, unitsPerContract: number): number { return roundTo(costPerContract / unitsPerContract, 4); }

function floorWithPrecision(value: number, increment?: number, decimalPlaces = 2): number {
  const factor = increment != null ? 1.0 / increment : Math.pow(10, decimalPlaces);
  return Math.floor(value * factor) / factor;
}

function convertUsdBushelToBrlSack(p: number, fx: number): number { return p * SOYBEAN.BUSHELS_PER_SACK * fx; }
function convertBrlSackToUsdBushel(p: number, fx: number): number { return p / fx / SOYBEAN.BUSHELS_PER_SACK; }

// =============================================================================
// OPTIONS UTILS  (faithful port of OptionsUtils)
// =============================================================================

function calculateBlack76Price(F: number, K: number, T: number, r: number, sigma: number, optionType: string): number {
  if (F <= 0 || T <= 0 || sigma <= 0) throw new Error(`Invalid params F=${F} T=${T} sigma=${sigma}`);
  const sqrtT = Math.sqrt(T);
  const d1 = (Math.log(F / K) + 0.5 * sigma * sigma * T) / (sigma * sqrtT);
  const d2 = d1 - sigma * sqrtT;
  const disc = Math.exp(-r * T);
  const price = optionType === "call" ? disc * (F * normCdf(d1) - K * normCdf(d2)) : disc * (K * normCdf(-d2) - F * normCdf(-d1));
  return roundTo(price, 4);
}

function suggestStrikeFromOtmPct(fp: number, otm: number, ot: string): number {
  return roundTo(ot === "call" ? fp * (1 + otm) : fp * (1 - otm), 4);
}

function calculatePremiumCarry(premiumBrl: number, tradeDate: string | Date, endDate: string | Date, interestRate: number, ratePeriod: string): number {
  return calculateFinancialCost(tradeDate, endDate, interestRate, ratePeriod, premiumBrl);
}

function calculateTotalInsuranceCost(premium: number, carry: number): number { return roundTo(premium + carry, 4); }

function calculateOptionBrokeragePerSack(bpc: number, spc: number, additionalLegs = 0, onExit = false): number {
  let cost = (bpc * (1 + additionalLegs)) / spc;
  if (onExit) cost *= 2;
  return roundTo(cost, 4);
}

function calculateMaxLoss(entry: number, strike: number, insCost: number, optBrk: number, optType: string, fullHedge: boolean): number {
  if (!fullHedge) return MAX_LOSS_UNLIMITED;
  if (optType === "call") return roundTo((strike - entry) + insCost + optBrk, 4);
  if (optType === "put") return roundTo(insCost + optBrk, 4);
  throw new Error(`Invalid option_type '${optType}'`);
}

// =============================================================================
// SOYBEAN CBOT ENGINE  (faithful port)
// =============================================================================

interface EngineResult {
  origination_price_gross_brl: number;
  origination_price_net_brl: number;
  target_basis_brl: number;
  breakeven_basis_brl: number;
  purchased_basis_brl: number;
  breakeven_basis_usd?: number;
  purchased_basis_usd?: number;
  ticker: string;
  exp_date: string;
  futures_price_usd?: number;
  futures_price_brl: number;
  exchange_rate?: number;
  costs: Record<string, number>;
  insurance_type?: string | null;
  insurance_strike_brl?: number | null;
  max_loss_counterparty_brl?: number;
  convergence_iterations: number;
}

function calculateOriginationPriceSoybeanCbot(oi: Record<string, unknown>, md: Record<string, unknown>, tol = 0.001): EngineResult {
  const paymentDate = oi["payment_date"] as string, saleDate = oi["sale_date"] as string, grainReception = oi["grain_reception_date"] as string;
  const interestRate = oi["interest_rate"] as number, ratePeriodRaw = oi["interest_rate_period"] as string;
  const storageCostVal = oi["storage_cost"] as number, storageTypeRaw = oi["storage_cost_type"] as string;
  const receptionCost = oi["reception_cost"] as number, brokerageContract = oi["brokerage_per_contract"] as number;
  const targetBasis = oi["target_basis"] as number, deskCostPct = oi["desk_cost_pct"] as number;
  const shrinkageRate = (oi["shrinkage_rate_monthly"] as number) ?? 0.0;
  const roundingInc = (oi["rounding_increment"] as number) ?? 0.50;
  const tradeDate = (oi["trade_date"] as string) ?? paymentDate;
  const insuranceChargeBrl = (oi["insurance_charge_brl"] as number) ?? 0.0;
  const insuranceCostBrlInput = (oi["insurance_cost_brl"] as number) ?? 0.0;
  const insuranceStrikeBrl = (oi["insurance_strike_brl"] as number | null) ?? null;
  const insuranceType = (oi["insurance_type"] as string | null) ?? null;
  const brokerageLegs = (oi["brokerage_legs"] as number) ?? 1;
  const brokerageOnExit = (oi["brokerage_on_exit"] as boolean) ?? false;

  const cbotFuturesUsd = md["cbot_futures_usd"] as number, ticker = md["ticker"] as string, expDate = md["exp_date"] as string, fxRate = md["exchange_rate"] as number;

  const ratePeriod = ["am", "a.m", "a.m.", "monthly"].includes(ratePeriodRaw) ? "monthly" : "yearly";
  const rate = interestRate > 0.5 ? interestRate / 100 : interestRate;
  const storageType = ["fixo", "fixed"].includes(storageTypeRaw) ? "fixed" : "monthly";

  const futuresBrl = convertUsdBushelToBrlSack(cbotFuturesUsd, fxRate);

  const brokerageUsdBu = calculateBrokerageCost(brokerageContract, SOYBEAN.CONTRACT_SIZE_BUSHELS);
  const brokerageBrl = brokerageUsdBu * SOYBEAN.BUSHELS_PER_SACK * fxRate;

  const optionLegs = Math.max(brokerageLegs - 1, 0);
  const sacksPerContract = SOYBEAN.CONTRACT_SIZE_BUSHELS / SOYBEAN.BUSHELS_PER_SACK;
  let optionBrokerageBrl = 0.0;
  if (optionLegs > 0) optionBrokerageBrl = calculateOptionBrokeragePerSack(brokerageContract, sacksPerContract, optionLegs - 1, brokerageOnExit);
  const totalBrokerageBrl = brokerageBrl + optionBrokerageBrl;

  let insuranceTotalCostBrl = 0.0;
  if (insuranceCostBrlInput > 0.0) {
    const carryEnd = grainReception || paymentDate;
    const carry = calculatePremiumCarry(insuranceCostBrlInput, tradeDate, carryEnd, rate, ratePeriod);
    insuranceTotalCostBrl = calculateTotalInsuranceCost(insuranceCostBrlInput, carry);
  }

  let priceEstimate = futuresBrl, iterations = 0;
  let storageTotal = 0, financialCost = 0, totalCosts = 0, grossPrice = 0, netPrice = 0;

  while (true) {
    iterations++;
    storageTotal = calculateStorageCost(storageCostVal, storageType, receptionCost, grainReception, saleDate, shrinkageRate, priceEstimate);
    financialCost = calculateFinancialCost(paymentDate, saleDate, rate, ratePeriod, priceEstimate);
    totalCosts = storageTotal + financialCost + totalBrokerageBrl + insuranceChargeBrl;
    grossPrice = calculateOriginationPrice(futuresBrl, targetBasis, totalCosts);
    netPrice = applyPercentageSpread(grossPrice, -deskCostPct);
    if (Math.abs(netPrice - priceEstimate) < tol) break;
    if (iterations >= 100) throw new Error(`Convergence not reached after 100 iterations. Delta: ${Math.abs(netPrice - priceEstimate).toFixed(6)}`);
    priceEstimate = netPrice;
  }

  netPrice = floorWithPrecision(netPrice, roundingInc);
  const deskCost = grossPrice * deskCostPct;
  const purchasedBasisBrl = netPrice - futuresBrl;
  const breakevenBasisBrl = purchasedBasisBrl + totalCosts + deskCost;

  let maxLoss = MAX_LOSS_UNLIMITED;
  if (insuranceType && insuranceStrikeBrl && insuranceCostBrlInput > 0.0)
    maxLoss = calculateMaxLoss(futuresBrl, insuranceStrikeBrl, insuranceTotalCostBrl, optionBrokerageBrl, insuranceType, true);

  return {
    origination_price_gross_brl: roundTo(grossPrice, 4), origination_price_net_brl: roundTo(netPrice, 4),
    target_basis_brl: roundTo(targetBasis, 4), breakeven_basis_brl: roundTo(breakevenBasisBrl, 4), purchased_basis_brl: roundTo(purchasedBasisBrl, 4),
    breakeven_basis_usd: roundTo(convertBrlSackToUsdBushel(breakevenBasisBrl, fxRate), 6),
    purchased_basis_usd: roundTo(convertBrlSackToUsdBushel(purchasedBasisBrl, fxRate), 6),
    ticker, exp_date: String(expDate), futures_price_usd: roundTo(cbotFuturesUsd, 6), futures_price_brl: roundTo(futuresBrl, 4), exchange_rate: roundTo(fxRate, 5),
    costs: { storage_brl: roundTo(storageTotal, 4), financial_brl: roundTo(financialCost, 4), brokerage_brl: roundTo(totalBrokerageBrl, 4), desk_cost_brl: roundTo(deskCost, 4), insurance_charge_brl: roundTo(insuranceChargeBrl, 4), insurance_cost_brl: roundTo(insuranceTotalCostBrl, 4), total_brl: roundTo(totalCosts + deskCost, 4) },
    insurance_type: insuranceType, insurance_strike_brl: insuranceStrikeBrl ? roundTo(insuranceStrikeBrl, 4) : null,
    max_loss_counterparty_brl: roundTo(maxLoss, 4), convergence_iterations: iterations,
  };
}

// =============================================================================
// CORN B3 ENGINE  (faithful port)
// =============================================================================

function calculateOriginationPriceCornB3(oi: Record<string, unknown>, md: Record<string, unknown>, tol = 0.001): EngineResult {
  const paymentDate = oi["payment_date"] as string, saleDate = oi["sale_date"] as string, grainReception = oi["grain_reception_date"] as string;
  const interestRate = oi["interest_rate"] as number, ratePeriodRaw = oi["interest_rate_period"] as string;
  const storageCostVal = oi["storage_cost"] as number, storageTypeRaw = oi["storage_cost_type"] as string;
  const receptionCost = oi["reception_cost"] as number, brokerageContract = oi["brokerage_per_contract"] as number;
  const targetBasis = oi["target_basis"] as number, deskCostPct = oi["desk_cost_pct"] as number;
  const shrinkageRate = (oi["shrinkage_rate_monthly"] as number) ?? 0.0;
  const roundingInc = (oi["rounding_increment"] as number) ?? CORN.ROUNDING_INCREMENT;

  const b3FuturesBrl = md["b3_futures_brl"] as number, ticker = md["ticker"] as string, expDate = md["exp_date"] as string;

  const ratePeriod = ["am", "a.m", "a.m.", "monthly"].includes(ratePeriodRaw) ? "monthly" : "yearly";
  const rate = interestRate > 0.5 ? interestRate / 100 : interestRate;
  const storageType = ["fixo", "fixed"].includes(storageTypeRaw) ? "fixed" : "monthly";

  const brokerageBrl = calculateBrokerageCost(brokerageContract, CORN.B3_SACKS_PER_CONTRACT);

  let priceEstimate = b3FuturesBrl, iterations = 0;
  let storageTotal = 0, financialCost = 0, totalCosts = 0, grossPrice = 0, netPrice = 0;

  while (true) {
    iterations++;
    storageTotal = calculateStorageCost(storageCostVal, storageType, receptionCost, grainReception, saleDate, shrinkageRate, priceEstimate);
    financialCost = calculateFinancialCost(paymentDate, saleDate, rate, ratePeriod, priceEstimate);
    totalCosts = storageTotal + financialCost + brokerageBrl;
    grossPrice = calculateOriginationPrice(b3FuturesBrl, targetBasis, totalCosts);
    netPrice = applyPercentageSpread(grossPrice, -deskCostPct);
    if (Math.abs(netPrice - priceEstimate) < tol) break;
    if (iterations >= 100) throw new Error(`Convergence not reached after 100 iterations. Delta: ${Math.abs(netPrice - priceEstimate).toFixed(6)}`);
    priceEstimate = netPrice;
  }

  netPrice = floorWithPrecision(netPrice, roundingInc);
  const deskCost = grossPrice * deskCostPct;
  const purchasedBasis = netPrice - b3FuturesBrl;
  const breakevenBasis = purchasedBasis + totalCosts + deskCost;

  return {
    origination_price_gross_brl: roundTo(grossPrice, 4), origination_price_net_brl: roundTo(netPrice, 4),
    target_basis_brl: roundTo(targetBasis, 4), breakeven_basis_brl: roundTo(breakevenBasis, 4), purchased_basis_brl: roundTo(purchasedBasis, 4),
    ticker, exp_date: String(expDate), futures_price_brl: roundTo(b3FuturesBrl, 4),
    costs: { storage_brl: roundTo(storageTotal, 4), financial_brl: roundTo(financialCost, 4), brokerage_brl: roundTo(brokerageBrl, 4), desk_cost_brl: roundTo(deskCost, 4), total_brl: roundTo(totalCosts + deskCost, 4) },
    convergence_iterations: iterations,
  };
}

// =============================================================================
// INSURANCE HELPER  (faithful port of _calculate_insurance_prices)
// =============================================================================

function calculateInsurancePrices(F_brl: number, tradeDate: string, grainReceptionDate: string, r: number, sigma: number, interestRate: number, interestRatePeriod: string, optionType = "call"): Record<string, { strike_brl: number; premium_brl: number; carry_brl: number; total_cost_brl: number }> {
  const days = calculateDaysBetween(tradeDate, grainReceptionDate);
  const T = days / 365.0;
  const levels: Record<string, number> = { atm: 0.0, otm_5: 0.05, otm_10: 0.10 };
  const result: Record<string, { strike_brl: number; premium_brl: number; carry_brl: number; total_cost_brl: number }> = {};

  for (const [label, otmPct] of Object.entries(levels)) {
    const strike = suggestStrikeFromOtmPct(F_brl, otmPct, optionType);
    let premium: number;
    if (T <= 0) { premium = roundTo(optionType === "call" ? Math.max(F_brl - strike, 0) : Math.max(strike - F_brl, 0), 4); }
    else { premium = calculateBlack76Price(F_brl, strike, T, r, sigma, optionType); }
    const carry = T > 0 ? calculatePremiumCarry(premium, tradeDate, grainReceptionDate, interestRate, interestRatePeriod) : 0;
    result[label] = { strike_brl: strike, premium_brl: premium, carry_brl: roundTo(carry, 4), total_cost_brl: calculateTotalInsuranceCost(premium, carry) };
  }
  return result;
}

// =============================================================================
// COMMODITY DEFAULTS
// =============================================================================

const COMMODITY_DEFAULTS: Record<string, Record<string, unknown>> = {
  soybean: { interest_rate: 1.4, interest_rate_period: "monthly", storage_cost: 3.5, storage_cost_type: "fixed", reception_cost: 0.0, brokerage_per_contract: 15.0, desk_cost_pct: 0.003, shrinkage_rate_monthly: 0.0, risk_free_rate: 0.149, sigma: 0.35, option_type: "call", additional_discount_brl: 0.0, rounding_increment: SOYBEAN.ROUNDING_INCREMENT },
  corn: { interest_rate: 1.4, interest_rate_period: "monthly", storage_cost: 3.5, storage_cost_type: "fixed", reception_cost: 0.0, brokerage_per_contract: 12.0, desk_cost_pct: 0.003, shrinkage_rate_monthly: 0.003, risk_free_rate: 0.149, sigma: 0.35, option_type: "call", additional_discount_brl: 0.0, rounding_increment: CORN.ROUNDING_INCREMENT },
};

// =============================================================================
// MAIN RUNNER  (faithful port of run_custom_pricing_table)
// =============================================================================

function runCustomPricingTable(combinations: Record<string, unknown>[], tradeDate?: string): Record<string, unknown>[] {
  const globalTradeDate = tradeDate ?? new Date().toISOString().substring(0, 10);
  const results: Record<string, unknown>[] = [];

  for (const combo of combinations) {
    const commodity = combo["commodity"] as string;
    if (!COMMODITY_DEFAULTS[commodity]) throw new Error(`Unknown commodity: '${commodity}'.`);

    const merged = { ...COMMODITY_DEFAULTS[commodity], ...combo };
    const effectiveTradeDate = (merged["trade_date"] as string) ?? globalTradeDate;
    const grainReceptionDate = (merged["grain_reception_date"] as string) || (merged["payment_date"] as string);

    const operationInputs: Record<string, unknown> = {
      payment_date: merged["payment_date"], sale_date: merged["sale_date"], grain_reception_date: grainReceptionDate,
      interest_rate: merged["interest_rate"], interest_rate_period: merged["interest_rate_period"],
      storage_cost: merged["storage_cost"], storage_cost_type: merged["storage_cost_type"],
      reception_cost: merged["reception_cost"], brokerage_per_contract: merged["brokerage_per_contract"],
      target_basis: merged["target_basis"], desk_cost_pct: merged["desk_cost_pct"],
      shrinkage_rate_monthly: merged["shrinkage_rate_monthly"], rounding_increment: merged["rounding_increment"],
    };

    let marketData: Record<string, unknown>;
    let engineResult: EngineResult;

    if (commodity === "soybean") {
      marketData = { cbot_futures_usd: merged["futures_price"], ticker: merged["ticker"], exp_date: merged["exp_date"], exchange_rate: merged["exchange_rate"] };
      engineResult = calculateOriginationPriceSoybeanCbot(operationInputs, marketData);
    } else {
      marketData = { b3_futures_brl: merged["futures_price"], ticker: merged["ticker"], exp_date: merged["exp_date"] };
      engineResult = calculateOriginationPriceCornB3(operationInputs, marketData);
    }

    let F_brl: number;
    if (commodity === "soybean") { F_brl = convertUsdBushelToBrlSack(merged["futures_price"] as number, merged["exchange_rate"] as number); }
    else { F_brl = merged["futures_price"] as number; }

    const rateDecimal = (merged["interest_rate"] as number) / 100;
    const insurance = calculateInsurancePrices(F_brl, effectiveTradeDate, grainReceptionDate, merged["risk_free_rate"] as number, merged["sigma"] as number, rateDecimal, merged["interest_rate_period"] as string, merged["option_type"] as string);

    const discount = Number(merged["additional_discount_brl"] ?? 0);
    const originationBrl = roundTo(engineResult.origination_price_net_brl - discount, 4);

    results.push({
      warehouse_id: merged["warehouse_id"], display_name: merged["display_name"], commodity,
      payment_date: operationInputs["payment_date"], grain_reception_date: operationInputs["grain_reception_date"],
      sale_date: operationInputs["sale_date"], trade_date_used: effectiveTradeDate,
      target_basis_brl: merged["target_basis"], ticker: merged["ticker"],
      origination_price_brl: originationBrl, gross_price_brl: engineResult.origination_price_gross_brl,
      purchased_basis_brl: engineResult.purchased_basis_brl, breakeven_basis_brl: engineResult.breakeven_basis_brl,
      futures_price_brl: F_brl, costs: engineResult.costs, engine_result: engineResult,
      additional_discount_brl: discount, insurance,
    });
  }
  return results;
}

// =============================================================================
// EDGE FUNCTION HANDLER
// =============================================================================

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const dailyTableParamId = body.daily_table_param_id;

    if (!dailyTableParamId) {
      return new Response(JSON.stringify({ success: false, error: "daily_table_param_id is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Fetch daily_table_params
    const { data: params, error: paramsError } = await supabase.from("daily_table_params").select("*").eq("id", dailyTableParamId).single();
    if (paramsError || !params) {
      return new Response(JSON.stringify({ success: false, error: paramsError?.message ?? "not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const rawCombinations = params.combinations;
    const combinations: Record<string, unknown>[] = Array.isArray(rawCombinations) ? rawCombinations : [];
    const globalParams = (params.global_params as Record<string, unknown>) ?? {};

    if (combinations.length === 0) {
      return new Response(JSON.stringify({ success: false, error: "No combinations found" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const tradeDate = (globalParams["trade_date"] as string) ?? new Date().toISOString().substring(0, 10);

    // 2. Create pricing_run (using actual schema: input_id is required, use a dummy or existing pricing_input)
    // The schema requires input_id (uuid FK to pricing_inputs). We create a minimal pricing_input first.
    // Pick the first commodity from the combinations, or default to soybean
    const firstCommodityCode = (combinations[0]?.["commodity"] as string) ?? "soybean";
    const commodityIdMap: Record<string, string> = { soybean: "4609fc30-4dd5-4197-b48f-69172e510fc3", corn: "baee0b58-5137-4fa1-be96-287870a3ee2f" };
    const commodityId = commodityIdMap[firstCommodityCode] ?? commodityIdMap["soybean"];

    const { data: inputData, error: inputError } = await supabase
      .from("pricing_inputs")
      .insert({
        commodity_id: commodityId,
        payment_date: tradeDate,
        sale_date: tradeDate,
        simulation_date: tradeDate,
        notes: `Auto-created by run-daily-table for param_id=${dailyTableParamId}`,
      })
      .select("id")
      .single();

    if (inputError || !inputData) {
      console.error("Failed to create pricing_input:", inputError);
      return new Response(JSON.stringify({ success: false, error: `Failed to create pricing_input: ${inputError?.message}` }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: runData, error: runError } = await supabase
      .from("pricing_runs")
      .insert({
        input_id: inputData.id,
        status: "running",
        engine_name: "run-custom-pricing",
        engine_version: "ts-faithful-v1",
        input_snapshot: { daily_table_param_id: dailyTableParamId, global_params: globalParams, combinations_count: combinations.length },
        market_snapshot: params.market_data ?? {},
        parameters_snapshot: globalParams,
        engine_result: {},
      })
      .select("id")
      .single();

    if (runError || !runData) {
      console.error("Failed to create pricing_run:", runError);
      return new Response(JSON.stringify({ success: false, error: runError?.message ?? "Failed to create run" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const runId = runData.id;

    try {
      // 3. Execute pricing engine
      const results = runCustomPricingTable(combinations, tradeDate);

      // 4. Insert pricing_run_items (actual schema: id, pricing_run_id, commodity, scenario, result, selected)
      const items = results.map((r, idx) => ({
        pricing_run_id: runId,
        commodity: r["commodity"] as string,
        scenario: (r["display_name"] as string) ?? `Item ${idx + 1}`,
        result: r, // full result as JSONB
        selected: false,
      }));

      if (items.length > 0) {
        const { error: itemsError } = await supabase.from("pricing_run_items").insert(items);
        if (itemsError) { console.error("Failed to insert items:", itemsError); throw new Error(`Failed to insert items: ${itemsError.message}`); }
      }

      // 5. Update run to completed
      const engineResultSummary = {
        items_created: results.length,
        engine_version: "ts-faithful-v1",
        message: "Run created with faithful TypeScript engine (ported from Python)",
        sample_result: results.length > 0 ? { origination_price_brl: results[0]["origination_price_brl"], commodity: results[0]["commodity"] } : null,
      };

      await supabase.from("pricing_runs").update({
        status: "completed",
        engine_result: engineResultSummary,
      }).eq("id", runId);

      return new Response(JSON.stringify({
        success: true, pricing_run_id: runId, calculated_items: results.length,
        warning_count: 0, engine_version: "ts-faithful-v1", output_unit: "R$/sc",
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

    } catch (engineErr) {
      await supabase.from("pricing_runs").update({ status: "failed", error_message: String(engineErr), engine_result: { error: String(engineErr) } }).eq("id", runId);
      console.error("Engine error:", engineErr);
      return new Response(JSON.stringify({ success: false, error: String(engineErr) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ success: false, error: String(err) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
