import type { Operation, PricingResult, InsuranceResult, InsuranceStrategy } from '@/types/pricing';

export interface CreateOperationInput {
  pricingResult: PricingResult;
  insuranceResult?: InsuranceResult;
  volume: number;
  operation_date: string;
  broker: string;
  account: string;
  notes: string;
  insurance_strategy: InsuranceStrategy;
}

export function buildOperationLegs(input: CreateOperationInput): string {
  const { pricingResult, insurance_strategy } = input;
  const isSoy = pricingResult.combination.commodity === 'soybean';

  const legs: string[] = [];

  if (isSoy) {
    legs.push(`Futures: ${pricingResult.combination.ticker}`);
    legs.push(`NDF: USD/BRL @ ${pricingResult.exchange_rate}`);
    if (insurance_strategy !== 'none') {
      legs.push(`Option: Put ${insurance_strategy.toUpperCase()}`);
    }
  } else {
    legs.push(`Futures: ${pricingResult.combination.ticker}`);
    if (insurance_strategy !== 'none') {
      legs.push(`Option: Put ${insurance_strategy.toUpperCase()}`);
    }
  }

  return legs.join(' | ');
}

export function createOperation(input: CreateOperationInput): Operation {
  const { pricingResult, insuranceResult, volume, operation_date, broker, account, notes, insurance_strategy } = input;
  const c = pricingResult.combination;

  return {
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    commodity: c.commodity,
    display_name: c.display_name,
    warehouse: c.warehouse,
    ticker: c.ticker,
    maturity: c.maturity,
    futures_price: pricingResult.futures_price,
    exchange_rate: pricingResult.exchange_rate,
    gross_price_brl: pricingResult.gross_price_brl,
    origination_price_brl: pricingResult.origination_price_brl,
    purchased_basis_brl: pricingResult.purchased_basis_brl,
    breakeven_basis_brl: pricingResult.breakeven_basis_brl,
    payment_date: c.payment_date,
    sale_date: c.sale_date,
    costs_snapshot: {
      net_costs: pricingResult.net_costs_brl,
    },
    insurance_strategy,
    insurance_premium_brl: insuranceResult?.premium_brl ?? 0,
    insurance_strike: insuranceResult?.strike_price ?? 0,
    volume,
    operation_date,
    broker,
    account,
    notes,
    status: 'open',
    pricing_snapshot: pricingResult,
    legs: buildOperationLegs(input),
  };
}
