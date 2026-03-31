
CREATE OR REPLACE FUNCTION public.promote_pricing_run_item_to_operation(p_item_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
AS $function$
declare
  v_item record;
  v_operation_id uuid;
  v_commodity_id uuid;
begin
  select *
  into v_item
  from public.pricing_run_items
  where id = p_item_id;

  if not found then
    raise exception 'pricing_run_item não encontrado: %', p_item_id;
  end if;

  if v_item.is_promoted_to_operation = true then
    return v_item.operation_id;
  end if;

  -- Resolve commodity_id from commodity text
  select id into v_commodity_id
  from public.commodities
  where code = v_item.commodity
  limit 1;

  if v_commodity_id is null then
    -- fallback: pick first active commodity
    select id into v_commodity_id
    from public.commodities
    where is_active = true
    limit 1;
  end if;

  if v_commodity_id is null then
    raise exception 'Nenhuma commodity encontrada para: %', v_item.commodity;
  end if;

  insert into public.operations (
    commodity_id,
    commodity,
    display_name,
    warehouse,
    ticker,
    futures_price,
    exchange_rate,
    gross_price_brl,
    origination_price_brl,
    purchased_basis_brl,
    breakeven_basis_brl,
    payment_date,
    sale_date,
    costs_snapshot,
    volume,
    operation_date,
    pricing_snapshot,
    status
  )
  values (
    v_commodity_id,
    v_item.commodity,
    v_item.combination_name,
    v_item.warehouse,
    v_item.ticker,
    v_item.futures_price,
    v_item.exchange_rate,
    v_item.gross_price_brl,
    v_item.origination_price_brl,
    v_item.purchased_basis_brl,
    v_item.breakeven_basis_brl,
    v_item.payment_date,
    v_item.sale_date,
    jsonb_build_object('target_basis_brl', v_item.target_basis_brl),
    null,
    now()::date,
    v_item.result_snapshot,
    'open'
  )
  returning id into v_operation_id;

  update public.pricing_run_items
  set
    is_promoted_to_operation = true,
    operation_id = v_operation_id
  where id = p_item_id;

  return v_operation_id;
end;
$function$;
