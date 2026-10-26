
-- Once the application is switched, the post-deploy migration must
-- disable old client-supplied p_base_amount redemptions.
DO $$ BEGIN
  IF has_function_privilege('anon','public.redeem_catalog_voucher(text,text,uuid,text,integer)','EXECUTE') THEN
    RAISE EXCEPTION 'Old insecure RPC is still executable after cutover';
  END IF;
  RAISE NOTICE 'PASS post-deploy legacy RPC revocation';
END $$;
