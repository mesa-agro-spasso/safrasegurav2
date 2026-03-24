
-- 1. daily_table_params
CREATE TABLE public.daily_table_params (
  id text PRIMARY KEY,
  market_data jsonb DEFAULT '{}'::jsonb,
  global_params jsonb DEFAULT '{}'::jsonb,
  combinations jsonb DEFAULT '[]'::jsonb,
  results jsonb DEFAULT '{}'::jsonb,
  generated_at timestamp with time zone,
  updated_at timestamp with time zone DEFAULT now()
);

-- 2. operations
CREATE TABLE public.operations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  commodity text,
  display_name text,
  warehouse text,
  ticker text,
  maturity text,
  futures_price numeric,
  exchange_rate numeric,
  gross_price_brl numeric,
  origination_price_brl numeric,
  purchased_basis_brl numeric,
  breakeven_basis_brl numeric,
  payment_date date,
  sale_date date,
  costs_snapshot jsonb DEFAULT '{}'::jsonb,
  insurance_strategy text DEFAULT 'none',
  insurance_premium_brl numeric DEFAULT 0,
  insurance_strike numeric DEFAULT 0,
  volume numeric DEFAULT 0,
  operation_date date,
  broker text,
  account text,
  notes text,
  status text DEFAULT 'open',
  pricing_snapshot jsonb DEFAULT '{}'::jsonb,
  legs text
);

-- 3. insurance_profiles
CREATE TABLE public.insurance_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 4. updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 5. triggers
CREATE TRIGGER set_updated_at_operations
  BEFORE UPDATE ON public.operations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_insurance_profiles
  BEFORE UPDATE ON public.insurance_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_daily_table_params
  BEFORE UPDATE ON public.daily_table_params
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 6. RLS policies (open for development)
ALTER TABLE public.daily_table_params ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to daily_table_params" ON public.daily_table_params FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.operations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to operations" ON public.operations FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.insurance_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to insurance_profiles" ON public.insurance_profiles FOR ALL USING (true) WITH CHECK (true);

-- 7. Seed default row for daily_table_params
INSERT INTO public.daily_table_params (id, market_data, global_params, combinations, results)
VALUES (
  'default',
  '{"usd_brl_spot":4.97,"usd_forward":{"2025-03":5.02,"2025-05":5.08,"2025-07":5.15,"2025-09":5.22,"2025-11":5.28},"soybean_futures":{"ZSK25":1042.5,"ZSN25":1058.25,"ZSQ25":1065,"ZSU25":1048.75,"ZSX25":1052},"corn_cbot_futures":{"ZCK25":458.25,"ZCN25":465.5,"ZCU25":472,"ZCZ25":478.75},"corn_b3_manual":{"CCMK25":72.5,"CCMN25":74.8,"CCMU25":76.2},"updated_at":"2025-01-01T00:00:00Z"}'::jsonb,
  '{"interest_rate":12.5,"storage_cost":2.8,"reception_cost":3.5,"desk_cost":1.2,"brokerage":0.8,"risk_premium":1.5,"soybean_volatility":22,"corn_volatility":28,"option_type":"put","rounding":2,"soy_conversion_factor":0.3674,"soy_freight_premium":8.5,"corn_conversion_factor":0.3937,"corn_freight_premium":6.2}'::jsonb,
  '[]'::jsonb,
  '{}'::jsonb
);

-- 8. Seed insurance_profiles
INSERT INTO public.insurance_profiles (name, type) VALUES
  ('Sem Seguro', 'none'),
  ('ATM', 'atm'),
  ('OTM 5%', 'otm_5'),
  ('OTM 10%', 'otm_10');
