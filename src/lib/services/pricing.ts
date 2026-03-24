import type {
  Combination,
  GlobalParameters,
  MarketData,
  PricingResult,
  InsuranceResult,
  DailyTableData,
  InsuranceStrategy,
} from '@/types/pricing';

function getEffectiveParam(
  combination: Combination,
  global: GlobalParameters,
  param: keyof GlobalParameters
): number {
  const overrideKey = `override_${param}` as keyof Combination;
  const override = combination[overrideKey];
  if (override !== null && override !== undefined) return override as number;
  return global[param] as number;
}

function calculatePricing(
  combination: Combination,
  global: GlobalParameters,
  market: MarketData
): PricingResult {
  const isSoy = combination.commodity === 'soybean';
  const futuresMap = isSoy ? market.soybean_futures : market.corn_cbot_futures;
  const futuresPrice = futuresMap[combination.ticker] ?? combination.contract_price;

  // Get forward rate or spot
  const forwardKey = combination.maturity.substring(0, 7);
  const exchangeRate = market.usd_forward[forwardKey] ?? market.usd_brl_spot;

  const convFactor = isSoy ? global.soy_conversion_factor : global.corn_conversion_factor;
  const freight = isSoy ? global.soy_freight_premium : global.corn_freight_premium;

  // Gross price in BRL
  const grossPriceBrl = (futuresPrice / 100) * convFactor * exchangeRate;

  // Costs
  const interestRate = getEffectiveParam(combination, global, 'interest_rate');
  const storageCost = getEffectiveParam(combination, global, 'storage_cost');
  const receptionCost = getEffectiveParam(combination, global, 'reception_cost');
  const deskCost = getEffectiveParam(combination, global, 'desk_cost');
  const brokerage = getEffectiveParam(combination, global, 'brokerage');
  const riskPremium = getEffectiveParam(combination, global, 'risk_premium');

  const totalCosts =
    (interestRate / 100) * grossPriceBrl +
    storageCost +
    receptionCost +
    deskCost +
    brokerage +
    (riskPremium / 100) * grossPriceBrl +
    freight;

  const originationPrice = grossPriceBrl - totalCosts - combination.additional_discount;
  const breakevenBasis = combination.target_basis;
  const purchasedBasis = originationPrice - grossPriceBrl;
  const margin = purchasedBasis - breakevenBasis;

  return {
    combination_id: combination.id,
    combination,
    futures_price: futuresPrice,
    exchange_rate: exchangeRate,
    gross_price_brl: Number(grossPriceBrl.toFixed(global.rounding)),
    net_costs_brl: Number(totalCosts.toFixed(global.rounding)),
    origination_price_brl: Number(originationPrice.toFixed(global.rounding)),
    breakeven_basis_brl: Number(breakevenBasis.toFixed(global.rounding)),
    purchased_basis_brl: Number(purchasedBasis.toFixed(global.rounding)),
    margin_brl: Number(margin.toFixed(global.rounding)),
  };
}

function calculateInsurance(
  result: PricingResult,
  global: GlobalParameters,
  strategy: InsuranceStrategy
): InsuranceResult {
  if (strategy === 'none') {
    return {
      combination_id: result.combination_id,
      strategy,
      premium_usd: 0,
      premium_brl: 0,
      strike_price: 0,
      insured_price_brl: result.origination_price_brl,
    };
  }

  const isSoy = result.combination.commodity === 'soybean';
  const vol = isSoy ? global.soybean_volatility : global.corn_volatility;

  let strikeFactor = 1;
  if (strategy === 'otm_5') strikeFactor = 0.95;
  if (strategy === 'otm_10') strikeFactor = 0.90;

  const strike = result.futures_price * strikeFactor;
  const premiumUsd = result.futures_price * (vol / 100) * 0.4 * (strategy === 'atm' ? 1 : strategy === 'otm_5' ? 0.65 : 0.4);
  const premiumBrl = premiumUsd * result.exchange_rate / 100;

  return {
    combination_id: result.combination_id,
    strategy,
    premium_usd: Number(premiumUsd.toFixed(2)),
    premium_brl: Number(premiumBrl.toFixed(2)),
    strike_price: Number(strike.toFixed(2)),
    insured_price_brl: Number((result.origination_price_brl - premiumBrl).toFixed(2)),
  };
}

export function generateDailyTable(
  combinations: Combination[],
  global: GlobalParameters,
  market: MarketData
): DailyTableData {
  const results = combinations.map((c) => calculatePricing(c, global, market));

  const strategies: InsuranceStrategy[] = ['atm', 'otm_5', 'otm_10'];
  const insurance: InsuranceResult[] = [];

  for (const result of results) {
    for (const strategy of strategies) {
      insurance.push(calculateInsurance(result, global, strategy));
    }
  }

  return {
    generated_at: new Date().toISOString(),
    status: 'current',
    results,
    insurance,
  };
}
