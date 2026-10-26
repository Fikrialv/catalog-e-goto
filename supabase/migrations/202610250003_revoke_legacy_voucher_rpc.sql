-- Apply only AFTER the Next.js deployment has switched to
-- redeem_catalog_voucher_for_schedule. This closes the legacy unsafe
-- p_base_amount function once the old app is no longer serving requests.
REVOKE ALL ON FUNCTION public.redeem_catalog_voucher(text,text,uuid,text,integer)
  FROM PUBLIC, anon, authenticated;
