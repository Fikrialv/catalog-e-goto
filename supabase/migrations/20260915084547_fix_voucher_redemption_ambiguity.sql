create or replace function public.redeem_catalog_voucher(
  p_voucher_id text,
  p_destination_id text,
  p_session_id uuid,
  p_price_id text,
  p_base_amount integer
)
returns table (id text, voucher_id text, amount integer, final_amount integer)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  voucher_row public.vouchers%rowtype;
  existing_row public.voucher_redemptions%rowtype;
  next_id text;
begin
  select vr.* into existing_row
  from public.voucher_redemptions as vr
  where vr.voucher_id = p_voucher_id
    and vr.destination_id = p_destination_id
    and vr.session_id = p_session_id;

  if found then
    return query select existing_row.id, existing_row.voucher_id, existing_row.amount, existing_row.final_amount;
    return;
  end if;

  update public.vouchers as v
  set redeemed_count = v.redeemed_count + 1
  where v.id = p_voucher_id
    and v.destination_id = p_destination_id
    and v.status = 'active'
    and v.redeemed_count < v.usage_limit
  returning v.* into voucher_row;

  if not found then
    raise exception 'Kode voucher tidak berlaku untuk trip ini atau kuota telah habis.';
  end if;

  next_id := encode(digest(p_voucher_id || ':' || p_destination_id || ':' || p_session_id::text, 'sha256'), 'hex');
  insert into public.voucher_redemptions (
    id, voucher_id, destination_id, session_id, price_id, amount, final_amount
  ) values (
    next_id, p_voucher_id, p_destination_id, p_session_id, p_price_id,
    voucher_row.amount, greatest(0, p_base_amount - voucher_row.amount)
  );

  return query select next_id, p_voucher_id, voucher_row.amount, greatest(0, p_base_amount - voucher_row.amount);
end;
$$;
