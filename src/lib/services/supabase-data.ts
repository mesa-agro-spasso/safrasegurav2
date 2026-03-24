import { supabase } from '@/integrations/supabase/client';
import type { MarketData, GlobalParameters, Combination, DailyTableData, Operation, InsuranceStrategy } from '@/types/pricing';
import type { CreateOperationInput } from './operations';
import { buildOperationLegs } from './operations';

// ===== DAILY TABLE PARAMS =====

interface DailyTableParamsRow {
  id: string;
  market_data: MarketData;
  global_params: GlobalParameters;
  combinations: Combination[];
  results: DailyTableData | Record<string, never>;
  generated_at: string | null;
  updated_at: string;
}

export async function loadDailyTableParams(): Promise<DailyTableParamsRow> {
  const { data, error } = await supabase
    .from('daily_table_params')
    .select('*')
    .eq('id', 'default')
    .single();

  if (error) throw error;
  return data as unknown as DailyTableParamsRow;
}

export async function saveMarketData(marketData: MarketData) {
  const { error } = await supabase
    .from('daily_table_params')
    .update({ market_data: JSON.parse(JSON.stringify(marketData)) })
    .eq('id', 'default');
  if (error) throw error;
}

export async function saveGlobalParams(params: GlobalParameters) {
  const { error } = await supabase
    .from('daily_table_params')
    .update({ global_params: JSON.parse(JSON.stringify(params)) })
    .eq('id', 'default');
  if (error) throw error;
}

export async function saveCombinations(combinations: Combination[]) {
  const { error } = await supabase
    .from('daily_table_params')
    .update({ combinations: JSON.parse(JSON.stringify(combinations)) })
    .eq('id', 'default');
  if (error) throw error;
}

export async function saveResults(results: DailyTableData) {
  const { error } = await supabase
    .from('daily_table_params')
    .update({
      results: JSON.parse(JSON.stringify(results)),
      generated_at: results.generated_at,
    })
    .eq('id', 'default');
  if (error) throw error;
}

// ===== OPERATIONS =====

export async function loadOperations(): Promise<Operation[]> {
  const { data, error } = await supabase
    .from('operations')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    created_at: row.created_at as string,
    commodity: row.commodity as Operation['commodity'],
    display_name: row.display_name as string,
    warehouse: row.warehouse as string,
    ticker: row.ticker as string,
    maturity: row.maturity as string,
    futures_price: Number(row.futures_price),
    exchange_rate: Number(row.exchange_rate),
    gross_price_brl: Number(row.gross_price_brl),
    origination_price_brl: Number(row.origination_price_brl),
    purchased_basis_brl: Number(row.purchased_basis_brl),
    breakeven_basis_brl: Number(row.breakeven_basis_brl),
    payment_date: row.payment_date as string,
    sale_date: row.sale_date as string,
    costs_snapshot: row.costs_snapshot as Record<string, number>,
    insurance_strategy: row.insurance_strategy as InsuranceStrategy,
    insurance_premium_brl: Number(row.insurance_premium_brl),
    insurance_strike: Number(row.insurance_strike),
    volume: Number(row.volume),
    operation_date: row.operation_date as string,
    broker: row.broker as string,
    account: row.account as string,
    notes: row.notes as string,
    status: row.status as Operation['status'],
    pricing_snapshot: row.pricing_snapshot as Operation['pricing_snapshot'],
    legs: row.legs as string,
  }));
}

export async function createOperationInDb(input: CreateOperationInput): Promise<Operation> {
  const { pricingResult, insuranceResult, volume, operation_date, broker, account, notes, insurance_strategy } = input;
  const c = pricingResult.combination;
  const legs = buildOperationLegs(input);

  const row = {
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
    costs_snapshot: { net_costs: pricingResult.net_costs_brl },
    insurance_strategy,
    insurance_premium_brl: insuranceResult?.premium_brl ?? 0,
    insurance_strike: insuranceResult?.strike_price ?? 0,
    volume,
    operation_date,
    broker,
    account,
    notes,
    status: 'open',
    pricing_snapshot: pricingResult as unknown as Record<string, unknown>,
    legs,
  };

  const insertRow = {
    ...row,
    costs_snapshot: JSON.parse(JSON.stringify(row.costs_snapshot)),
    pricing_snapshot: JSON.parse(JSON.stringify(row.pricing_snapshot)),
  };

  const { data, error } = await supabase
    .from('operations')
    .insert(insertRow)
    .select()
    .single();

  if (error) throw error;

  // Map back to Operation type
  const d = data as Record<string, unknown>;
  return {
    id: d.id as string,
    created_at: d.created_at as string,
    commodity: d.commodity as Operation['commodity'],
    display_name: d.display_name as string,
    warehouse: d.warehouse as string,
    ticker: d.ticker as string,
    maturity: d.maturity as string,
    futures_price: Number(d.futures_price),
    exchange_rate: Number(d.exchange_rate),
    gross_price_brl: Number(d.gross_price_brl),
    origination_price_brl: Number(d.origination_price_brl),
    purchased_basis_brl: Number(d.purchased_basis_brl),
    breakeven_basis_brl: Number(d.breakeven_basis_brl),
    payment_date: d.payment_date as string,
    sale_date: d.sale_date as string,
    costs_snapshot: d.costs_snapshot as Record<string, number>,
    insurance_strategy: d.insurance_strategy as InsuranceStrategy,
    insurance_premium_brl: Number(d.insurance_premium_brl),
    insurance_strike: Number(d.insurance_strike),
    volume: Number(d.volume),
    operation_date: d.operation_date as string,
    broker: d.broker as string,
    account: d.account as string,
    notes: d.notes as string,
    status: d.status as Operation['status'],
    pricing_snapshot: d.pricing_snapshot as Operation['pricing_snapshot'],
    legs: d.legs as string,
  };
}

export async function updateOperationStatusInDb(id: string, status: Operation['status']) {
  const { error } = await supabase
    .from('operations')
    .update({ status })
    .eq('id', id);
  if (error) throw error;
}

// ===== INSURANCE PROFILES =====

export interface InsuranceProfile {
  id: string;
  name: string;
  type: string;
}

export async function loadInsuranceProfiles(): Promise<InsuranceProfile[]> {
  const { data, error } = await supabase
    .from('insurance_profiles')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    name: row.name as string,
    type: row.type as string,
  }));
}
