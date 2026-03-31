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

function calculateDaysBetween(
  startDate: string | Date,
  endDate: string | Date,
): number {
  const s = toDate(startDate);
  const e = toDate(endDate);
  const diffMs = Math.abs(e.getTime() - s.getTime());
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

function getHistoricalBasis(
  historicalBasis: number | Record<number, number>,
  targetMonth?: number,
  defaultBasis = 0.0,
): number {
  if (typeof historicalBasis === "number") return historicalBasis;
  if (typeof historicalBasis === "object") {
    const month = targetMonth ?? new Date().getMonth() + 1;
    return historicalBasis[month] ?? defaultBasis;
  }
  throw new Error("historical_basis must be a number or dict");
}

// =============================================================================
// CONSTANTS  (faithful port of utils.py classes)
// =============================================================================

const SOYBEAN = {
  BUSHELS_PER_SACK: 2.20462,
  CONTRACT_SIZE_BUSHELS: 5000,
  ROUNDING_INCREMENT: 0.50,
};

const CORN = {
  BUSHELS_PER_SACK: 2.3622,
  CONTRACT_SIZE_BUSHELS: 5000,
  ROUNDING_INCREMENT: 0.25,
  B3_SACKS_PER_CONTRACT: 450,
};

const MAX_LOSS_UNLIMITED = 99_999_999.0;

// =============================================================================
// AGRO UTILS  (faithful port of AgroUtils)
// =============================================================================

function applyPercentageSpread(value: number, spreadRate: number): number {
  return value * (1 + spreadRate);
}

function calculateFinancialCost(
  startDate: string | Date,
  endDate: string | Date,
  interestRate: number,
  ratePeriod: string,
  baseValue: number,
  daysPerYear = 365.0,
): number {
  const start = toDate(startDate);
  const end = toDate(endDate);
  const daysElapsed = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);

  let periods: number;
  if (ratePeriod === "monthly") {
    periods = daysElapsed / 30.0;
  } else if (ratePeriod === "yearly") {
    periods = daysElapsed / daysPerYear;
  } else {
    throw new Error(`Invalid rate_period '${ratePeriod}'. Use 'monthly' or 'yearly'.`);
  }

  return (Math.pow(1 + interestRate, periods) - 1) * baseValue;
}

function calculateStorageCost(
  storageCost: number,
  storageCostType: string,
  receptionCost: number,
  startDate: string | Date,
  endDate: string | Date,
  shrinkageRateMonthly = 0.0,
  shrinkageBaseValue = 0.0,
): number {
  const start = toDate(startDate);
  const end = toDate(endDate);
  const daysElapsed = Math.max((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24), 0);
  const monthsElapsed = daysElapsed / 30.0;

  let total: number;
  if (storageCostType === "monthly") {
    total = storageCost * monthsElapsed + receptionCost;
  } else if (storageCostType === "fixed") {
    total = storageCost + receptionCost;
  } else {
    throw new Error(`Invalid storage_cost_type '${storageCostType}'.`);
  }

  if (shrinkageRateMonthly > 0.0) {
    total += shrinkageRateMonthly * monthsElapsed * shrinkageBaseValue;
  }

  return total;
}

function calculateOriginationPrice(
  exchangePrice: number,
  basis: number,
  costs: number,
  roundingPrecision = 4,
): number {
  const price = exchangePrice + basis - costs;
  return roundTo(price, roundingPrecision);
}

function calculateBrokerageCost(
  costPerContract: number,
  unitsPerContract: number,
): number {
  return roundTo(costPerContract / unitsPerContract, 4);
}

function floorWithPrecision(
  value: number,
  increment?: number,
  decimalPlaces = 2,
): number {
  const factor = increment != null ? 1.0 / increment : Math.pow(10, decimalPlaces);
  return Math.floor(value * factor) / factor;
}

function roundTo(value: number, places: number): number {
  const factor = Math.pow(10, places);
  return Math.round(value * factor) / factor;
}

// =============================================================================
// SOYBEAN UTILS
// =============================================================================

function convertUsdBushelToBrlSack(priceUsdBushel: number, exchangeRate: number): number {
  return priceUsdBushel * SOYBEAN.BUSHELS_PER_SACK * exchangeRate;
}

function convertBrlSackToUsdBushel(priceBrlSack: number, exchangeRate: number): number {
  return priceBrlSack / exchangeRate / SOYBEAN.BUSHELS_PER_SACK;
}

// =============================================================================
// OPTIONS UTILS  (faithful port of OptionsUtils)
// =============================================================================

function normCdf(x: number): number {
  // Approximation of the cumulative normal distribution using erf
  return 0.5 * (1.0 + erf(x / Math.sqrt(2.0)));
}

function erf(x: number): number {
  // Abramowitz and Stegun approximation 7.1.26
  const sign = x >= 0 ? 1 : -1;
  x = Math.abs(x);

  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const t = 1.0 / (1.0 + p * x);
  const y =
    1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return sign * y;
}

function calculateBlack76Price(
  F: number,
  K: number,
  T: number,
  r: number,
  sigma: number,
  optionType: string,
): number {
  if (F <= 0) throw new Error(`F must be positive, got ${F}`);
  if (T <= 0) throw new Error(`T must be positive, got ${T}`);
  if (sigma <= 0) throw new Error(`sigma must be positive, got ${sigma}`);

  const sqrtT = Math.sqrt(T);
  const d1 = (Math.log(F / K) + 0.5 * sigma * sigma * T) / (sigma * sqrtT);
  const d2 = d1 - sigma * sqrtT;
  const discount = Math.exp(-r * T);

  let price: number;
  if (optionType === "call") {
    price = discount * (F * normCdf(d1) - K * normCdf(d2));
  } else if (optionType === "put") {
    price = discount * (K * normCdf(-d2) - F * normCdf(-d1));
  } else {
    throw new Error(`Invalid option_type '${optionType}'.`);
  }

  return roundTo(price, 4);
}

function suggestStrikeFromOtmPct(
  futuresPrice: number,
  otmPct: number,
  optionType: string,
): number {
  if (optionType === "call") return roundTo(futuresPrice * (1 + otmPct), 4);
  if (optionType === "put") return roundTo(futuresPrice * (1 - otmPct), 4);
  throw new Error(`Invalid option_type '${optionType}'.`);
}

function calculatePremiumCarry(
  premiumBrl: number,
  tradeDate: string | Date,
  endDate: string | Date,
  interestRate: number,
  ratePeriod: string,
): number {
  return calculateFinancialCost(tradeDate, endDate, interestRate, ratePeriod, premiumBrl);
}

function calculateTotalInsuranceCost(
  premiumBrl: number,
  carryCostBrl: number,
): number {
  return roundTo(premiumBrl + carryCostBrl, 4);
}

function calculateOptionBrokeragePerSack(
  brokeragePerContract: number,
  sacksPerContract: number,
  additionalLegs = 0,
  brokerageOnExit = false,
): number {
  const totalLegs = 1 + additionalLegs;
  let cost = (brokeragePerContract * totalLegs) / sacksPerContract;
  if (brokerageOnExit) cost *= 2;
  return roundTo(cost, 4);
}

function calculateMaxLoss(
  entryPriceBrl: number,
  strikeBrl: number,
  insuranceCostBrl: number,
  optionBrokerageBrl: number,
  optionType: string,
  isFullHedge: boolean,
): number {
  if (!isFullHedge) return MAX_LOSS_UNLIMITED;
  if (optionType === "call") {
    return roundTo(
      (strikeBrl - entryPriceBrl) + insuranceCostBrl + optionBrokerageBrl,
      4,
    );
  }
  if (optionType === "put") {
    return roundTo(insuranceCostBrl + optionBrokerageBrl, 4);
  }
  throw new Error(`Invalid option_type '${optionType}'.`);
}

// =============================================================================
// SOYBEAN CBOT ENGINE  (faithful port of soybean_cbot_basis_pricing.py)
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
  costs: {
    storage_brl: number;
    financial_brl: number;
    brokerage_brl: number;
    desk_cost_brl: number;
    insurance_charge_brl?: number;
    insurance_cost_brl?: number;
    total_brl: number;
  };
  insurance_type?: string | null;
  insurance_strike_brl?: number | null;
  max_loss_counterparty_brl?: number;
  convergence_iterations: number;
  operation_inputs?: Record<string, unknown>;
  market_data?: Record<string, unknown>;
}

function calculateOriginationPriceSoybeanCbot(
  operationInputs: Record<string, unknown>,
  marketData: Record<string, unknown>,
  convergenceTolerance = 0.001,
): EngineResult {
  const paymentDate = operationInputs["payment_date"] as string;
  const saleDate = operationInputs["sale_date"] as string;
  const grainReception = operationInputs["grain_reception_date"] as string;
  const interestRate = operationInputs["interest_rate"] as number;
  const ratePeriodRaw = operationInputs["interest_rate_period"] as string;
  const storageCostVal = operationInputs["storage_cost"] as number;
  const storageTypeRaw = operationInputs["storage_cost_type"] as string;
  const receptionCost = operationInputs["reception_cost"] as number;
  const brokerageContract = operationInputs["brokerage_per_contract"] as number;
  const targetBasis = operationInputs["target_basis"] as number;
  const deskCostPct = operationInputs["desk_cost_pct"] as number;
  const shrinkageRate = (operationInputs["shrinkage_rate_monthly"] as number) ?? 0.0;
  const roundingInc = (operationInputs["rounding_increment"] as number) ?? 0.50;

  // Insurance inputs (all optional)
  const tradeDate = (operationInputs["trade_date"] as string) ?? paymentDate;
  const insuranceChargeBrl = (operationInputs["insurance_charge_brl"] as number) ?? 0.0;
  const insuranceCostBrl = (operationInputs["insurance_cost_brl"] as number) ?? 0.0;
  const insuranceStrikeBrl = (operationInputs["insurance_strike_brl"] as number | null) ?? null;
  const insuranceType = (operationInputs["insurance_type"] as string | null) ?? null;
  const brokerageLegs = (operationInputs["brokerage_legs"] as number) ?? 1;
  const brokerageOnExit = (operationInputs["brokerage_on_exit"] as boolean) ?? false;

  const cbotFuturesUsd = marketData["cbot_futures_usd"] as number;
  const ticker = marketData["ticker"] as string;
  const expDate = marketData["exp_date"] as string;
  const fxRate = marketData["exchange_rate"] as number;

  const ratePeriod = ["am", "a.m", "a.m.", "monthly"].includes(ratePeriodRaw) ? "monthly" : "yearly";
  const rate = interestRate > 0.5 ? interestRate / 100 : interestRate;
  const storageType = ["fixo", "fixed"].includes(storageTypeRaw) ? "fixed" : "monthly";

  const futuresBrl = convertUsdBushelToBrlSack(cbotFuturesUsd, fxRate);

  // Futures brokerage (always present)
  const brokerageUsdBu = calculateBrokerageCost(
    brokerageContract,
    SOYBEAN.CONTRACT_SIZE_BUSHELS,
  );
  const brokerageBrl = brokerageUsdBu * SOYBEAN.BUSHELS_PER_SACK * fxRate;

  // Option brokerage (only if brokerage_legs > 1)
  const optionLegs = Math.max(brokerageLegs - 1, 0);
  const sacksPerContract = SOYBEAN.CONTRACT_SIZE_BUSHELS / SOYBEAN.BUSHELS_PER_SACK;
  let optionBrokerageBrl = 0.0;
  if (optionLegs > 0) {
    optionBrokerageBrl = calculateOptionBrokeragePerSack(
      brokerageContract,
      sacksPerContract,
      optionLegs - 1,
      brokerageOnExit,
    );
  }
  const totalBrokerageBrl = brokerageBrl + optionBrokerageBrl;

  // Insurance calculations (constants — computed before convergence loop)
  let insuranceCarryBrl = 0.0;
  let insuranceTotalCostBrl = 0.0;
  if (insuranceCostBrl > 0.0) {
    const carryEndDate = grainReception || paymentDate;
    insuranceCarryBrl = calculatePremiumCarry(
      insuranceCostBrl,
      tradeDate,
      carryEndDate,
      rate,
      ratePeriod,
    );
    insuranceTotalCostBrl = calculateTotalInsuranceCost(insuranceCostBrl, insuranceCarryBrl);
  }

  // Iterative convergence
  let priceEstimate = futuresBrl;
  let iterations = 0;
  const maxIterations = 100;

  let storageTotal = 0;
  let financialCost = 0;
  let totalCosts = 0;
  let grossPrice = 0;
  let netPrice = 0;

  while (true) {
    iterations++;

    storageTotal = calculateStorageCost(
      storageCostVal,
      storageType,
      receptionCost,
      grainReception,
      saleDate,
      shrinkageRate,
      priceEstimate,
    );

    financialCost = calculateFinancialCost(
      paymentDate,
      saleDate,
      rate,
      ratePeriod,
      priceEstimate,
    );

    totalCosts = storageTotal + financialCost + totalBrokerageBrl + insuranceChargeBrl;

    grossPrice = calculateOriginationPrice(
      futuresBrl,
      targetBasis,
      totalCosts,
    );

    netPrice = applyPercentageSpread(grossPrice, -deskCostPct);

    if (Math.abs(netPrice - priceEstimate) < convergenceTolerance) break;

    if (iterations >= maxIterations) {
      throw new Error(
        `Convergence not reached after ${maxIterations} iterations. ` +
          `Last delta: ${Math.abs(netPrice - priceEstimate).toFixed(6)}`,
      );
    }

    priceEstimate = netPrice;
  }

  netPrice = floorWithPrecision(netPrice, roundingInc);
  const deskCost = grossPrice * deskCostPct;

  const purchasedBasisBrl = netPrice - futuresBrl;
  const breakeven_basis_brl = purchasedBasisBrl + totalCosts + deskCost;

  const breakeven_basis_usd = convertBrlSackToUsdBushel(breakeven_basis_brl, fxRate);
  const purchased_basis_usd = convertBrlSackToUsdBushel(purchasedBasisBrl, fxRate);

  // Max loss counterparty
  let maxLossCounterpartyBrl = MAX_LOSS_UNLIMITED;
  if (insuranceType && insuranceStrikeBrl && insuranceCostBrl > 0.0) {
    maxLossCounterpartyBrl = calculateMaxLoss(
      futuresBrl,
      insuranceStrikeBrl,
      insuranceTotalCostBrl,
      optionBrokerageBrl,
      insuranceType,
      true,
    );
  }

  return {
    origination_price_gross_brl: roundTo(grossPrice, 4),
    origination_price_net_brl: roundTo(netPrice, 4),
    target_basis_brl: roundTo(targetBasis, 4),
    breakeven_basis_brl: roundTo(breakeven_basis_brl, 4),
    purchased_basis_brl: roundTo(purchasedBasisBrl, 4),
    breakeven_basis_usd: roundTo(breakeven_basis_usd, 6),
    purchased_basis_usd: roundTo(purchased_basis_usd, 6),
    ticker,
    exp_date: String(expDate),
    futures_price_usd: roundTo(cbotFuturesUsd, 6),
    futures_price_brl: roundTo(futuresBrl, 4),
    exchange_rate: roundTo(fxRate, 5),
    costs: {
      storage_brl: roundTo(storageTotal, 4),
      financial_brl: roundTo(financialCost, 4),
      brokerage_brl: roundTo(totalBrokerageBrl, 4),
      desk_cost_brl: roundTo(deskCost, 4),
      insurance_charge_brl: roundTo(insuranceChargeBrl, 4),
      insurance_cost_brl: roundTo(insuranceTotalCostBrl, 4),
      total_brl: roundTo(totalCosts + deskCost, 4),
    },
    insurance_type: insuranceType,
    insurance_strike_brl: insuranceStrikeBrl ? roundTo(insuranceStrikeBrl, 4) : null,
    max_loss_counterparty_brl: roundTo(maxLossCounterpartyBrl, 4),
    convergence_iterations: iterations,
  };
}

// =============================================================================
// CORN B3 ENGINE  (faithful port of corn_b3_basis_pricing.py)
// =============================================================================

function calculateOriginationPriceCornB3(
  operationInputs: Record<string, unknown>,
  marketData: Record<string, unknown>,
  convergenceTolerance = 0.001,
): EngineResult {
  const paymentDate = operationInputs["payment_date"] as string;
  const saleDate = operationInputs["sale_date"] as string;
  const grainReception = operationInputs["grain_reception_date"] as string;
  const interestRate = operationInputs["interest_rate"] as number;
  const ratePeriodRaw = operationInputs["interest_rate_period"] as string;
  const storageCostVal = operationInputs["storage_cost"] as number;
  const storageTypeRaw = operationInputs["storage_cost_type"] as string;
  const receptionCost = operationInputs["reception_cost"] as number;
  const brokerageContract = operationInputs["brokerage_per_contract"] as number;
  const targetBasis = operationInputs["target_basis"] as number;
  const deskCostPct = operationInputs["desk_cost_pct"] as number;
  const shrinkageRate = (operationInputs["shrinkage_rate_monthly"] as number) ?? 0.0;
  const roundingInc = (operationInputs["rounding_increment"] as number) ?? CORN.ROUNDING_INCREMENT;

  const b3FuturesBrl = marketData["b3_futures_brl"] as number;
  const ticker = marketData["ticker"] as string;
  const expDate = marketData["exp_date"] as string;

  const ratePeriod = ["am", "a.m", "a.m.", "monthly"].includes(ratePeriodRaw) ? "monthly" : "yearly";
  const rate = interestRate > 0.5 ? interestRate / 100 : interestRate;
  const storageType = ["fixo", "fixed"].includes(storageTypeRaw) ? "fixed" : "monthly";

  const brokerageBrl = calculateBrokerageCost(
    brokerageContract,
    CORN.B3_SACKS_PER_CONTRACT,
  );

  // Iterative convergence
  let priceEstimate = b3FuturesBrl;
  let iterations = 0;
  const maxIterations = 100;

  let storageTotal = 0;
  let financialCost = 0;
  let totalCosts = 0;
  let grossPrice = 0;
  let netPrice = 0;

  while (true) {
    iterations++;

    storageTotal = calculateStorageCost(
      storageCostVal,
      storageType,
      receptionCost,
      grainReception,
      saleDate,
      shrinkageRate,
      priceEstimate,
    );

    financialCost = calculateFinancialCost(
      paymentDate,
      saleDate,
      rate,
      ratePeriod,
      priceEstimate,
    );

    totalCosts = storageTotal + financialCost + brokerageBrl;

    grossPrice = calculateOriginationPrice(
      b3FuturesBrl,
      targetBasis,
      totalCosts,
    );

    netPrice = applyPercentageSpread(grossPrice, -deskCostPct);

    if (Math.abs(netPrice - priceEstimate) < convergenceTolerance) break;

    if (iterations >= maxIterations) {
      throw new Error(
        `Convergence not reached after ${maxIterations} iterations. ` +
          `Last delta: ${Math.abs(netPrice - priceEstimate).toFixed(6)}`,
      );
    }

    priceEstimate = netPrice;
  }

  netPrice = floorWithPrecision(netPrice, roundingInc);
  const deskCost = grossPrice * deskCostPct;

  const purchasedBasis = netPrice - b3FuturesBrl;
  const breakevenBasis = purchasedBasis + totalCosts + deskCost;

  return {
    operation_inputs: operationInputs,
    market_data: marketData,
    origination_price_gross_brl: roundTo(grossPrice, 4),
    origination_price_net_brl: roundTo(netPrice, 4),
    target_basis_brl: roundTo(targetBasis, 4),
    breakeven_basis_brl: roundTo(breakevenBasis, 4),
    purchased_basis_brl: roundTo(purchasedBasis, 4),
    ticker,
    exp_date: String(expDate),
    futures_price_brl: roundTo(b3FuturesBrl, 4),
    costs: {
      storage_brl: roundTo(storageTotal, 4),
      financial_brl: roundTo(financialCost, 4),
      brokerage_brl: roundTo(brokerageBrl, 4),
      desk_cost_brl: roundTo(deskCost, 4),
      total_brl: roundTo(totalCosts + deskCost, 4),
    },
    convergence_iterations: iterations,
  };
}

// =============================================================================
// INSURANCE HELPER  (faithful port of _calculate_insurance_prices)
// =============================================================================

interface InsuranceLevelResult {
  strike_brl: number;
  premium_brl: number;
  carry_brl: number;
  total_cost_brl: number;
}

function calculateInsurancePrices(
  F_brl: number,
  tradeDate: string,
  grainReceptionDate: string,
  r: number,
  sigma: number,
  interestRate: number,
  interestRatePeriod: string,
  optionType = "call",
): Record<string, InsuranceLevelResult> {
  const days = calculateDaysBetween(tradeDate, grainReceptionDate);
  const T = days / 365.0;

  const levels: Record<string, number> = { atm: 0.0, otm_5: 0.05, otm_10: 0.10 };
  const result: Record<string, InsuranceLevelResult> = {};

  for (const [label, otmPct] of Object.entries(levels)) {
    const strike = suggestStrikeFromOtmPct(F_brl, otmPct, optionType);

    let premium: number;
    if (T <= 0) {
      // If T is zero or negative, premium is intrinsic value only
      premium = optionType === "call"
        ? Math.max(F_brl - strike, 0)
        : Math.max(strike - F_brl, 0);
      premium = roundTo(premium, 4);
    } else {
      premium = calculateBlack76Price(F_brl, strike, T, r, sigma, optionType);
    }

    const carry = T > 0
      ? calculatePremiumCarry(premium, tradeDate, grainReceptionDate, interestRate, interestRatePeriod)
      : 0;

    result[label] = {
      strike_brl: strike,
      premium_brl: premium,
      carry_brl: roundTo(carry, 4),
      total_cost_brl: calculateTotalInsuranceCost(premium, carry),
    };
  }

  return result;
}

// =============================================================================
// COMMODITY DEFAULTS  (faithful port from custom_pricing_table_runner.py)
// =============================================================================

const COMMODITY_DEFAULTS: Record<string, Record<string, unknown>> = {
  soybean: {
    interest_rate: 1.4,
    interest_rate_period: "monthly",
    storage_cost: 3.5,
    storage_cost_type: "fixed",
    reception_cost: 0.0,
    brokerage_per_contract: 15.0,
    desk_cost_pct: 0.003,
    shrinkage_rate_monthly: 0.0,
    risk_free_rate: 0.149,
    sigma: 0.35,
    option_type: "call",
    additional_discount_brl: 0.0,
    rounding_increment: SOYBEAN.ROUNDING_INCREMENT,
  },
  corn: {
    interest_rate: 1.4,
    interest_rate_period: "monthly",
    storage_cost: 3.5,
    storage_cost_type: "fixed",
    reception_cost: 0.0,
    brokerage_per_contract: 12.0,
    desk_cost_pct: 0.003,
    shrinkage_rate_monthly: 0.003,
    risk_free_rate: 0.149,
    sigma: 0.35,
    option_type: "call",
    additional_discount_brl: 0.0,
    rounding_increment: CORN.ROUNDING_INCREMENT,
  },
};

// =============================================================================
// MARKET DATA BUILDER  (faithful port of _build_market_data)
// =============================================================================

function buildMarketData(commodity: string, combo: Record<string, unknown>): Record<string, unknown> {
  if (commodity === "soybean") {
    return {
      cbot_futures_usd: combo["futures_price"],
      ticker: combo["ticker"],
      exp_date: combo["exp_date"],
      exchange_rate: combo["exchange_rate"],
    };
  }
  if (commodity === "corn") {
    return {
      b3_futures_brl: combo["futures_price"],
      ticker: combo["ticker"],
      exp_date: combo["exp_date"],
    };
  }
  throw new Error(`Unknown commodity: '${commodity}'.`);
}

// =============================================================================
// MAIN RUNNER  (faithful port of run_custom_pricing_table)
// =============================================================================

function runCustomPricingTable(
  combinations: Record<string, unknown>[],
  tradeDate?: string,
): Record<string, unknown>[] {
  const globalTradeDate = tradeDate ?? new Date().toISOString().substring(0, 10);
  const results: Record<string, unknown>[] = [];

  for (const combo of combinations) {
    const commodity = combo["commodity"] as string;

    if (!COMMODITY_DEFAULTS[commodity]) {
      throw new Error(`Unknown commodity: '${commodity}'. Must be 'soybean' or 'corn'.`);
    }

    // Merge: defaults ← combination (combination wins)
    const merged = { ...COMMODITY_DEFAULTS[commodity], ...combo };

    // Resolve trade_date
    const effectiveTradeDate = (merged["trade_date"] as string) ?? globalTradeDate;

    // grain_reception_date defaults to payment_date
    const grainReceptionDate =
      (merged["grain_reception_date"] as string) || (merged["payment_date"] as string);

    const marketData = buildMarketData(commodity, merged);

    const operationInputs: Record<string, unknown> = {
      payment_date: merged["payment_date"],
      sale_date: merged["sale_date"],
      grain_reception_date: grainReceptionDate,
      interest_rate: merged["interest_rate"],
      interest_rate_period: merged["interest_rate_period"],
      storage_cost: merged["storage_cost"],
      storage_cost_type: merged["storage_cost_type"],
      reception_cost: merged["reception_cost"],
      brokerage_per_contract: merged["brokerage_per_contract"],
      target_basis: merged["target_basis"],
      desk_cost_pct: merged["desk_cost_pct"],
      shrinkage_rate_monthly: merged["shrinkage_rate_monthly"],
      rounding_increment: merged["rounding_increment"],
    };

    // Dispatch to appropriate engine
    let engineResult: EngineResult;
    if (commodity === "soybean") {
      engineResult = calculateOriginationPriceSoybeanCbot(operationInputs, marketData);
    } else {
      engineResult = calculateOriginationPriceCornB3(operationInputs, marketData);
    }

    // Futures price in BRL/sack for insurance and display
    let F_brl: number;
    if (commodity === "soybean") {
      F_brl = convertUsdBushelToBrlSack(
        merged["futures_price"] as number,
        merged["exchange_rate"] as number,
      );
    } else {
      F_brl = merged["futures_price"] as number;
    }

    // Interest rate stored as 1.4 → decimal 0.014
    const rateDecimal = (merged["interest_rate"] as number) / 100;

    const insurance = calculateInsurancePrices(
      F_brl,
      effectiveTradeDate,
      grainReceptionDate,
      merged["risk_free_rate"] as number,
      merged["sigma"] as number,
      rateDecimal,
      merged["interest_rate_period"] as string,
      merged["option_type"] as string,
    );

    const discount = Number(merged["additional_discount_brl"] ?? 0);
    const grossEngine = engineResult.origination_price_net_brl;
    const originationBrl = roundTo(grossEngine - discount, 4);

    results.push({
      warehouse_id: merged["warehouse_id"],
      display_name: merged["display_name"],
      commodity,
      payment_date: operationInputs["payment_date"],
      grain_reception_date: operationInputs["grain_reception_date"],
      sale_date: operationInputs["sale_date"],
      trade_date_used: effectiveTradeDate,
      target_basis_brl: merged["target_basis"],
      ticker: merged["ticker"],
      origination_price_brl: originationBrl,
      gross_price_brl: engineResult.origination_price_gross_brl,
      purchased_basis_brl: engineResult.purchased_basis_brl,
      breakeven_basis_brl: engineResult.breakeven_basis_brl,
      futures_price_brl: F_brl,
      costs: engineResult.costs,
      engine_result: engineResult,
      additional_discount_brl: discount,
      insurance,
    });
  }

  return results;
}

// =============================================================================
// EDGE FUNCTION HANDLER
// =============================================================================

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const dailyTableParamId = body.daily_table_param_id;

    if (!dailyTableParamId) {
      return new Response(
        JSON.stringify({ success: false, error: "daily_table_param_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Fetch daily_table_params
    const { data: params, error: paramsError } = await supabase
      .from("daily_table_params")
      .select("*")
      .eq("id", dailyTableParamId)
      .single();

    if (paramsError || !params) {
      return new Response(
        JSON.stringify({
          success: false,
          error: paramsError?.message ?? `daily_table_params '${dailyTableParamId}' not found`,
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const combinations = (params.combinations as Record<string, unknown>[]) ?? [];
    const globalParams = (params.global_params as Record<string, unknown>) ?? {};
    const marketDataRaw = (params.market_data as Record<string, unknown>) ?? {};

    if (combinations.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "No combinations found in daily_table_params" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 2. Create pricing_run record
    const tradeDate = (globalParams["trade_date"] as string) ?? new Date().toISOString().substring(0, 10);

    const { data: runData, error: runError } = await supabase
      .from("pricing_runs")
      .insert({
        daily_table_param_id: dailyTableParamId,
        run_type: "daily_table",
        status: "running",
        engine_name: "run-custom-pricing",
        engine_version: "ts-faithful-v1",
        input_payload: {
          market_data: marketDataRaw,
          global_params: globalParams,
          combinations,
        },
        started_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (runError || !runData) {
      console.error("Failed to create pricing_run:", runError);
      return new Response(
        JSON.stringify({ success: false, error: runError?.message ?? "Failed to create run" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const runId = runData.id;

    try {
      // 3. Execute pricing engine
      const results = runCustomPricingTable(combinations, tradeDate);

      // 4. Insert pricing_run_items
      const items = results.map((r, idx) => ({
        pricing_run_id: runId,
        item_index: idx + 1,
        combination_name: r["display_name"] ?? r["warehouse_id"] ?? `Item ${idx + 1}`,
        commodity: r["commodity"],
        warehouse: r["warehouse_id"] ?? null,
        ticker: r["ticker"],
        maturity: null,
        payment_date: r["payment_date"],
        sale_date: r["sale_date"],
        reception_date: r["grain_reception_date"],
        volume: r["volume"] ?? null,
        futures_price: (r["engine_result"] as EngineResult).futures_price_brl,
        exchange_rate: (r["engine_result"] as EngineResult).exchange_rate ?? null,
        ndf_forward_rate: null,
        gross_price_brl: r["gross_price_brl"],
        origination_price_brl: r["origination_price_brl"],
        target_basis_brl: r["target_basis_brl"],
        purchased_basis_brl: r["purchased_basis_brl"],
        breakeven_basis_brl: r["breakeven_basis_brl"],
        insurance_strategy: "none",
        insurance_premium_brl: 0,
        insurance_strike: null,
        insurance_cost_brl: 0,
        status: "calculated",
        input_snapshot: {
          operation_inputs: (r["engine_result"] as EngineResult).operation_inputs ?? {},
          market_data: (r["engine_result"] as EngineResult).market_data ?? {},
          trade_date_used: r["trade_date_used"],
          additional_discount_brl: r["additional_discount_brl"],
        },
        result_snapshot: {
          engine_result: r["engine_result"],
          insurance: r["insurance"],
          costs: r["costs"],
        },
      }));

      if (items.length > 0) {
        const { error: itemsError } = await supabase
          .from("pricing_run_items")
          .insert(items);

        if (itemsError) {
          console.error("Failed to insert items:", itemsError);
          throw new Error(`Failed to insert items: ${itemsError.message}`);
        }
      }

      // 5. Update run to completed
      await supabase
        .from("pricing_runs")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          output_summary: {
            items_created: results.length,
            engine_version: "ts-faithful-v1",
            message: "Run criado com engine TypeScript fiel ao motor Python",
          },
        })
        .eq("id", runId);

      return new Response(
        JSON.stringify({
          success: true,
          pricing_run_id: runId,
          calculated_items: results.length,
          warning_count: 0,
          engine_version: "ts-faithful-v1",
          output_unit: "R$/sc",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    } catch (engineErr) {
      // Mark run as failed
      await supabase
        .from("pricing_runs")
        .update({
          status: "failed",
          error_message: String(engineErr),
          completed_at: new Date().toISOString(),
        })
        .eq("id", runId);

      console.error("Engine error:", engineErr);
      return new Response(
        JSON.stringify({ success: false, error: String(engineErr) }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ success: false, error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
