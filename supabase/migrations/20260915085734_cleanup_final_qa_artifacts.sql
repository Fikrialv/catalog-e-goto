-- Remove only data created by the final QA run. Production catalog data is untouched.
delete from public.voucher_redemptions
where voucher_id in (
  select id
  from public.vouchers
  where code_preview = 'FIN•••26'
);

delete from public.vouchers
where code_preview = 'FIN•••26';

delete from public.catalog_events
where session_id = '11111111-1111-4111-8111-111111111111';
