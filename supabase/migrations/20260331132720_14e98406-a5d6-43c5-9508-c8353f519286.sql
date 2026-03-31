
ALTER TABLE public.pricing_run_items
ADD COLUMN IF NOT EXISTS is_promoted_to_operation boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS operation_id uuid;
