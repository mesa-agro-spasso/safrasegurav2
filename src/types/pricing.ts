// ===== ENUMS =====

export type Commodity = 'soybean' | 'corn';
export type InsuranceStrategy = 'none' | 'atm' | 'otm_5' | 'otm_10';
export type OperationStatus = 'open' | 'closed' | 'cancelled';
export type OptionType = 'call' | 'put';

// ===== MARKET DATA =====

export interface MarketData {
  usd_brl_spot: number;
  usd_forward: Record<string, number>; // keyed by maturity
  soybean_futures: Record<string, number>; // keyed by ticker
  corn_cbot_futures: Record<string, number>;
  corn_b3_manual: Record<string, number>;
  updated_at: string;
}

// ===== GLOBAL PARAMETERS =====

export interface GlobalParameters {
  // Financial
  interest_rate: number; // % annual
  storage_cost: number; // BRL/bag/month
  reception_cost: number; // BRL/ton
  desk_cost: number; // BRL/ton
  brokerage: number; // BRL/contract
  risk_premium: number; // %

  // Volatility
  soybean_volatility: number; // %
  corn_volatility: number; // %

  // Options
  option_type: OptionType;
  rounding: number; // decimal places

  // Soybean specific
  soy_conversion_factor: number;
  soy_freight_premium: number; // BRL/ton

  // Corn specific
  corn_conversion_factor: number;
  corn_freight_premium: number; // BRL/ton
}

// ===== COMBINATION =====

export interface Combination {
  id: string;
  commodity: Commodity;
  display_name: string;
  warehouse: string;
  ticker: string;
  contract_price: number;
  maturity: string; // YYYY-MM
  payment_date: string; // YYYY-MM-DD
  reception_date: string; // YYYY-MM-DD
  sale_date: string; // YYYY-MM-DD
  target_basis: number;
  additional_discount: number;

  // Parameter overrides (null = inherit global)
  override_interest_rate: number | null;
  override_storage_cost: number | null;
  override_reception_cost: number | null;
  override_desk_cost: number | null;
  override_brokerage: number | null;
  override_risk_premium: number | null;
}

// ===== DAILY TABLE RESULTS =====

export interface PricingResult {
  combination_id: string;
  combination: Combination;
  futures_price: number;
  exchange_rate: number;
  gross_price_brl: number;
  net_costs_brl: number;
  origination_price_brl: number;
  breakeven_basis_brl: number;
  purchased_basis_brl: number;
  margin_brl: number;
}

export interface InsuranceResult {
  combination_id: string;
  strategy: InsuranceStrategy;
  premium_usd: number;
  premium_brl: number;
  strike_price: number;
  insured_price_brl: number;
}

export interface DailyTableData {
  generated_at: string;
  status: 'current' | 'stale' | 'not_generated';
  results: PricingResult[];
  insurance: InsuranceResult[];
}

// ===== OPERATIONS =====

export interface Operation {
  id: string;
  created_at: string;
  commodity: Commodity;
  display_name: string;
  warehouse: string;
  ticker: string;
  maturity: string;
  futures_price: number;
  exchange_rate: number;
  gross_price_brl: number;
  origination_price_brl: number;
  purchased_basis_brl: number;
  breakeven_basis_brl: number;
  payment_date: string;
  sale_date: string;
  costs_snapshot: Record<string, number>;
  insurance_strategy: InsuranceStrategy;
  insurance_premium_brl: number;
  insurance_strike: number;
  volume: number;
  operation_date: string;
  broker: string;
  account: string;
  notes: string;
  status: OperationStatus;
  pricing_snapshot: PricingResult;
  // Legs
  legs: string; // description of legs
}
