import { supabase } from '@/integrations/supabase/client';
import type { MarketData, GlobalParameters, Combination, DailyTableData, Operation, InsuranceStrategy } from '@/types/pricing';
import type { CreateOperationInput } from './operations';
import { buildOperationLegs } from './operations';

const db = supabase as any;

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
  const { data, error } = await db.from('daily_table_params').select('*').eq('id', 'default').single();
  if (error) throw error;
  return data as DailyTableParamsRow;
}

export async function saveMarketData(marketData: MarketData) {
  const { error } = await db.from('daily_table_params').update({ market_data: JSON.parse(JSON.stringify(marketData)) }).eq('id', 'default');
  if (error) throw error;
}

export async function saveGlobalParams(params: GlobalParameters) {
  const { error } = await db.from('daily_table_params').update({ global_params: JSON.parse(JSON.stringify(params)) }).eq('id', 'default');
  if (error) throw error;
}

export async function saveCombinations(combinations: Combination[]) {
  const { error } = await db.from('daily_table_params').update({ combinations: JSON.parse(JSON.stringify(combinations)) }).eq('id', 'default');
  if (error) throw error;
}

export async function saveResults(results: DailyTableData) {
  const { error } = await db.from('daily_table_params').update({
    results: JSON.parse(JSON.stringify(results)),
    generated_at: results.generated_at,
  }).eq('id', 'default');
  if (error) throw error;
}

export async function loadOperations(): Promise<Operation[]> {
  const { data, error } = await supabase.from('operations').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    id: row.id,
    created_at: row.created_at,
    commodity: row.commodity ?? '',
    display_name: row.display_name ?? '',
    warehouse: row.warehouse ?? '',
    ticker: row.ticker ?? '',
    maturity: row.maturity ?? '',
    futures_price: Number(row.futures_price ?? 0),
    exchange_rate: Number(row.exchange_rate ?? 0),
    gross_price_brl: Number(row.gross_price_brl ?? 0),
    origination_price_brl: Number(row.origination_price_brl ?? 0),
    purchased_basis_brl: Number(row.purchased_basis_brl ?? 0),
    breakeven_basis_brl: Number(row.breakeven_basis_brl ?? 0),
    payment_date: row.payment_date ?? '',
    sale_date: row.sale_date ?? '',
    costs_snapshot: row.costs_snapshot ?? {},
    insurance_strategy: row.insurance_strategy ?? 'none',
    insurance_premium_brl: Number(row.insurance_premium_brl ?? 0),
    insurance_strike: Number(row.insurance_strike ?? 0),
    volume: Number(row.volume ?? 0),
    operation_date: row.operation_date ?? '',
    broker: row.broker ?? '',
    account: row.account ?? '',
    notes: row.notes ?? '',
    status: row.status ?? 'open',
    pricing_snapshot: row.pricing_snapshot ?? {},
    legs: row.legs ?? '',
  }));
}

export async function createOperationInDb(input: CreateOperationInput): Promise<Operation> {
  const { pricingResult, insuranceResult, volume, operation_date, broker, account, notes, insurance_strategy } = input;
  const c = pricingResult.combination;
  const legs = buildOperationLegs(input);

  const row: any = {
    commodity_id: c.commodity,
    metadata: {
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
      insurance_strategy,
      insurance_premium_brl: insuranceResult?.premium_brl ?? 0,
      insurance_strike: insuranceResult?.strike_price ?? 0,
      pricing_snapshot: pricingResult,
      legs,
      broker,
      account,
    },
    payment_date: c.payment_date,
    sale_date: c.sale_date,
    volume,
    notes,
    status: 'open',
    include_insurance: insurance_strategy !== 'none',
  };

  const { data, error } = await supabase.from('operations').insert(row as any).select().single();
  if (error) throw error;

  const d = data as any;
  const meta = d.metadata ?? {};
  return {
    id: d.id,
    created_at: d.created_at,
    commodity: meta.commodity ?? '',
    display_name: meta.display_name ?? '',
    warehouse: meta.warehouse ?? '',
    ticker: meta.ticker ?? '',
    maturity: meta.maturity ?? '',
    futures_price: Number(meta.futures_price ?? 0),
    exchange_rate: Number(meta.exchange_rate ?? 0),
    gross_price_brl: Number(meta.gross_price_brl ?? 0),
    origination_price_brl: Number(meta.origination_price_brl ?? 0),
    purchased_basis_brl: Number(meta.purchased_basis_brl ?? 0),
    breakeven_basis_brl: Number(meta.breakeven_basis_brl ?? 0),
    payment_date: d.payment_date ?? '',
    sale_date: d.sale_date ?? '',
    costs_snapshot: {},
    insurance_strategy: meta.insurance_strategy ?? 'none',
    insurance_premium_brl: Number(meta.insurance_premium_brl ?? 0),
    insurance_strike: Number(meta.insurance_strike ?? 0),
    volume: Number(d.volume ?? 0),
    operation_date: operation_date,
    broker: meta.broker ?? '',
    account: meta.account ?? '',
    notes: d.notes ?? '',
    status: d.status ?? 'open',
    pricing_snapshot: meta.pricing_snapshot ?? {},
    legs: meta.legs ?? '',
  };
}

export async function updateOperationStatusInDb(id: string, status: Operation['status']) {
  const { error } = await supabase.from('operations').update({ status } as any).eq('id', id);
  if (error) throw error;
}

export interface InsuranceProfile {
  id: string;
  name: string;
  type: string;
}

export async function loadInsuranceProfiles(): Promise<InsuranceProfile[]> {
  const { data, error } = await supabase.from('insurance_scenarios').select('*').order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    id: row.id,
    name: row.label ?? row.code ?? '',
    type: row.code ?? '',
  }));
}
