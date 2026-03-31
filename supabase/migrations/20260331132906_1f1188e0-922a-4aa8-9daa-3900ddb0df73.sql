
ALTER TABLE public.operations
ADD COLUMN IF NOT EXISTS commodity text,
ADD COLUMN IF NOT EXISTS display_name text,
ADD COLUMN IF NOT EXISTS warehouse text,
ADD COLUMN IF NOT EXISTS ticker text,
ADD COLUMN IF NOT EXISTS maturity text,
ADD COLUMN IF NOT EXISTS futures_price numeric,
ADD COLUMN IF NOT EXISTS exchange_rate numeric,
ADD COLUMN IF NOT EXISTS gross_price_brl numeric,
ADD COLUMN IF NOT EXISTS origination_price_brl numeric,
ADD COLUMN IF NOT EXISTS purchased_basis_brl numeric,
ADD COLUMN IF NOT EXISTS breakeven_basis_brl numeric,
ADD COLUMN IF NOT EXISTS costs_snapshot jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS insurance_strategy text,
ADD COLUMN IF NOT EXISTS insurance_premium_brl numeric,
ADD COLUMN IF NOT EXISTS insurance_strike numeric,
ADD COLUMN IF NOT EXISTS operation_date date,
ADD COLUMN IF NOT EXISTS pricing_snapshot jsonb DEFAULT '{}'::jsonb;
