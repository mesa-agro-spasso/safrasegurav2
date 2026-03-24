ALTER TABLE public.pricing_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_run_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to pricing_runs" ON public.pricing_runs;
CREATE POLICY "Allow all access to pricing_runs"
  ON public.pricing_runs FOR ALL TO public
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to pricing_run_items" ON public.pricing_run_items;
CREATE POLICY "Allow all access to pricing_run_items"
  ON public.pricing_run_items FOR ALL TO public
  USING (true) WITH CHECK (true);