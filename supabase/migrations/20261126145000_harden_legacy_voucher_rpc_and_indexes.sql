-- Prepared for the next E-GOTO deployment. No existing voucher records are modified.
-- The application uses redeem_catalog_voucher_for_schedule, not the legacy function.
-- Prevent bypassing schedule/availability validation via the obsolete RPC.
revoke execute on function public.redeem_catalog_voucher(text,text,uuid,text,integer)
  from public, anon, authenticated;

-- Foreign-key lookups during deletes/updates should have covering indexes.
create index if not exists audit_logs_user_id_idx
  on public.audit_logs(user_id);
create index if not exists slug_history_destination_id_idx
  on public.slug_history(destination_id);
create index if not exists voucher_redemptions_destination_id_idx
  on public.voucher_redemptions(destination_id);
create index if not exists vouchers_destination_id_idx
  on public.vouchers(destination_id);

-- RLS: preserve ADMIN write rights while avoiding duplicate permissive SELECT rules.
-- Do not change category policies here; role behavior must be tested with an admin session.
