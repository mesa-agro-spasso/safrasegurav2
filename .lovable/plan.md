

# Implementation Plan: Daily Table / Pricing Engine Module

This plan implements the complete 3-tab interface for the Daily Table page, connected to Supabase with no frontend calculations.

## Step 1: Database Migration

Create migration to enable RLS on `pricing_runs` and `pricing_run_items`:

```sql
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
```

## Step 2: Create Service Layer

**File: `src/lib/services/pricing-engine.ts`**

Functions:
- `fetchDailyTableParams()` -- reads `daily_table_params` where id='default', returns raw JSONB
- `updateDailyTableParams(market_data, global_params, combinations)` -- updates the record, using `preserveNumericTypes()` to ensure numbers aren't saved as strings
- `executePricing()` -- calls `supabase.functions.invoke('run-daily-table', { body: { daily_table_param_id: 'default' } })`, returns `{ success, pricing_run_id }`
- `fetchPricingRuns()` -- SELECT from pricing_runs ORDER BY created_at DESC
- `fetchRunItems(runId)` -- SELECT from pricing_run_items WHERE pricing_run_id = runId ORDER BY item_index
- `promoteItem(itemId)` -- calls `supabase.rpc('promote_pricing_run_item_to_operation', { p_item_id: itemId })`
- `fetchOperations()` -- SELECT from operations ORDER BY created_at DESC

All return `Record<string, unknown>[]` -- no type assumptions.

## Step 3: Create Components

### `src/components/pricing/MarketDataSection.tsx`
- Dynamically iterates `Object.entries(marketData)`
- Scalar numbers render as `<Input type="number">`
- Scalar strings render as `<Input type="text">`
- Nested objects (like `usd_forward`, `soybean_futures`) render as key-value sub-grids with editable values
- Preserves types: numeric inputs call `Number(e.target.value)` before storing

### `src/components/pricing/GlobalParamsSection.tsx`
- Dynamically iterates `Object.entries(globalParams)`
- Each key renders as a labeled input
- Numeric values render as `<Input type="number">` and are stored as numbers via `Number()`
- String values render as text inputs

### `src/components/pricing/CombinationsGrid.tsx`
- Uses a **fixed base column list**: combination_name, commodity, warehouse, ticker, maturity, payment_date, sale_date, reception_date, volume, futures_price, exchange_rate, ndf_forward_rate, target_basis_brl, purchased_basis_brl, insurance_strategy, insurance_premium_brl, insurance_strike
- Also discovers any extra keys from the data and appends them
- Add row / delete row buttons
- Inline editable inputs
- Numeric fields use `type="number"` and store as `Number()`

### `src/components/pricing/PricingRunsTab.tsx`
- Top panel: table of runs with status badges (pending/running/completed/failed), timestamps, engine info
- Bottom panel: RunItemsTable for selected run
- Auto-selects a run if `initialRunId` prop is provided

### `src/components/pricing/RunItemsTable.tsx`
- Table with all specified columns for pricing_run_items
- "Promover para Operação" button per row, calls `promoteItem()`
- After promotion: reloads items AND operations (via callback)
- Disabled button + "Operação criada" badge when `is_promoted_to_operation === true`
- "Ver Snapshots" button opens SnapshotViewer

### `src/components/pricing/SnapshotViewer.tsx`
- Dialog that shows formatted JSON for `input_snapshot` and `result_snapshot`
- Uses `JSON.stringify(data, null, 2)` with syntax highlighting via `<pre>` + monospace

### `src/components/pricing/OperationsTab.tsx`
- Read-only table of operations from Supabase
- Search/filter by display_name or commodity
- Click row opens OperationDetail sheet

### `src/components/pricing/OperationDetail.tsx`
- Sheet/drawer showing full operation detail
- Main data fields in organized grid
- `costs_snapshot` and `pricing_snapshot` rendered as formatted JSON
- Shows broker, account, notes, status
- No edit capability in this version

### `src/components/pricing/DailyTableTab.tsx`
- Composes MarketDataSection + GlobalParamsSection + CombinationsGrid
- "Salvar Parâmetros" button calls `updateDailyTableParams()`
- "Executar Pricing" button calls `executePricing()`, on success passes `pricing_run_id` to parent to switch tab

## Step 4: Rewrite DailyTable Page

**File: `src/pages/DailyTable.tsx`** (complete rewrite)

- 3 tabs: "Daily Table" | "Pricing Runs" | "Operations"
- Self-contained state via `useState` + `useEffect` (no global store)
- Loads data from Supabase on mount via `fetchDailyTableParams()`, `fetchPricingRuns()`, `fetchOperations()`
- After pricing execution: uses returned `pricing_run_id` to auto-select run and switch to Pricing Runs tab
- After promote: reloads both run items and operations list

## Files Summary

| Action | File |
|--------|------|
| Migration | RLS policies for pricing_runs, pricing_run_items |
| Create | `src/lib/services/pricing-engine.ts` |
| Create | `src/components/pricing/DailyTableTab.tsx` |
| Create | `src/components/pricing/MarketDataSection.tsx` |
| Create | `src/components/pricing/GlobalParamsSection.tsx` |
| Create | `src/components/pricing/CombinationsGrid.tsx` |
| Create | `src/components/pricing/PricingRunsTab.tsx` |
| Create | `src/components/pricing/RunItemsTable.tsx` |
| Create | `src/components/pricing/SnapshotViewer.tsx` |
| Create | `src/components/pricing/OperationsTab.tsx` |
| Create | `src/components/pricing/OperationDetail.tsx` |
| Rewrite | `src/pages/DailyTable.tsx` |

No changes to: `store.ts`, `Parameters.tsx`, `Combinations.tsx`, `Operations.tsx`, `App.tsx`, `AppSidebar.tsx`.

## Key Implementation Details

- **Type preservation**: `preserveNumericTypes()` recursively converts string-looking-numbers back to numbers before saving to JSONB
- **CombinationsGrid columns**: Fixed base list of 17 columns + dynamic extras from data
- **Post-promote reload**: After `promoteItem()` succeeds, both `fetchRunItems(runId)` and `fetchOperations()` are called to refresh UI immediately
- **Edge Function call**: Uses `supabase.functions.invoke()` (not raw fetch), which handles auth headers automatically

