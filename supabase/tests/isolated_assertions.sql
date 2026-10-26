-- Automated isolated Postgres integration assertions (never production).
CREATE OR REPLACE FUNCTION pg_temp.assert_equal(actual text, expected text, label text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  IF actual IS DISTINCT FROM expected THEN
    RAISE EXCEPTION 'FAIL %: expected %, got %', label, expected, actual;
  END IF;
  RAISE NOTICE 'PASS %', label;
END $$;

DO $$
DECLARE
  value jsonb;
  val integer;
  id1 text;
  id2 text;
  c integer;
BEGIN
  IF has_column_privilege('anon','public.catalog_documents','draft_payload','SELECT') THEN
    RAISE EXCEPTION 'Anon must not read unpublished draft_payload';
  END IF;
  IF NOT has_column_privilege('anon','public.catalog_documents','published_payload','SELECT') THEN
    RAISE EXCEPTION 'Anon must read published_payload';
  END IF;
  IF has_function_privilege('anon','public.redeem_catalog_voucher(text,text,uuid,text,integer)','EXECUTE') THEN
    RAISE EXCEPTION 'Old insecure RPC still publicly callable';
  END IF;
  IF NOT has_function_privilege('anon','public.redeem_catalog_voucher_for_schedule(text,text,uuid,text,text)','EXECUTE') THEN
    RAISE EXCEPTION 'Safe voucher RPC not callable';
  END IF;
  RAISE NOTICE 'PASS GRANT and REVOKE checks';
END $$;

-- Anonymous catalog access cannot SELECT unpublished payloads or draft-only trips.
SET ROLE anon;
DO $$ BEGIN
  IF (SELECT count(*) FROM public.catalog_documents) <> 1 THEN
    RAISE EXCEPTION 'Anon catalog must only contain published rows';
  END IF;
  IF (SELECT count(*) FROM public.catalog_documents WHERE id='trip-draft') <> 0 THEN
    RAISE EXCEPTION 'Anon can access draft row';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.catalog_documents
    WHERE id='trip-1' AND published_payload->>'slug'='uji-trip'
  ) THEN RAISE EXCEPTION 'Anon cannot read public trip'; END IF;
  RAISE NOTICE 'PASS public catalog isolation';
END $$;
RESET ROLE;

-- Test price calculation, date-only promotions, limit/idempotency
-- explicitly as anonymous role through the same RPC grants as PostgREST.
SET ROLE anon;
DO $$
DECLARE
  redemption record;
  repeat_row record;
  regular record;
  used integer;
BEGIN
  SELECT * INTO redemption FROM public.redeem_catalog_voucher_for_schedule(
    repeat('a',64),'trip-1',
    '11111111-1111-4111-8111-111111111111','meeting-jkt','oct'
  );
  IF redemption.amount <> 25000 OR redemption.final_amount <> 425000 THEN
    RAISE EXCEPTION 'Promo date + voucher incorrect: %', row_to_json(redemption);
  END IF;
  SELECT * INTO repeat_row FROM public.redeem_catalog_voucher_for_schedule(
    repeat('a',64),'trip-1',
    '11111111-1111-4111-8111-111111111111','meeting-jkt','oct'
  );
  IF repeat_row.id <> redemption.id OR repeat_row.final_amount <> 425000 THEN
    RAISE EXCEPTION 'Idempotent retry changed redemption';
  END IF;
  SELECT redeemed_count INTO used FROM public.vouchers WHERE id=repeat('a',64);
  IF used <> 1 THEN RAISE EXCEPTION 'Repeat redemption consumed quota'; END IF;
  BEGIN
    PERFORM * FROM public.redeem_catalog_voucher_for_schedule(
      repeat('a',64),'trip-1',
      '11111111-1111-4111-8111-111111111111','meeting-jkt','nov'
    );
    RAISE EXCEPTION 'Voucher used for another schedule should fail';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM NOT LIKE 'Voucher sudah dipakai%' THEN RAISE; END IF;
  END;
  SELECT * INTO regular FROM public.redeem_catalog_voucher_for_schedule(
    repeat('a',64),'trip-1',
    '22222222-2222-4222-8222-222222222222','meeting-jkt','nov'
  );
  IF regular.amount <> 25000 OR regular.final_amount <> 475000 THEN
    RAISE EXCEPTION 'Non-promo date voucher incorrect: %', row_to_json(regular);
  END IF;
  BEGIN
    PERFORM * FROM public.redeem_catalog_voucher_for_schedule(
      repeat('a',64),'trip-1',
      '33333333-3333-4333-8333-333333333333','meeting-jkt','nov'
    );
    RAISE EXCEPTION 'Voucher quota exceeded but request succeeded';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM NOT LIKE 'Kode voucher tidak berlaku%' THEN RAISE; END IF;
  END;
  BEGIN
    PERFORM * FROM public.redeem_catalog_voucher_for_schedule(
      repeat('a',64),'trip-1',
      '44444444-4444-4444-8444-444444444444','meeting-jkt','draft-sched'
    );
    RAISE EXCEPTION 'Draft schedule was accepted';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM NOT LIKE 'Tanggal trip sudah%' THEN RAISE; END IF;
  END;
  BEGIN
    PERFORM * FROM public.redeem_catalog_voucher_for_schedule(
      repeat('a',64),'trip-1',
      '55555555-5555-4555-8555-555555555555','meeting-jkt','closed'
    );
    RAISE EXCEPTION 'Full schedule was accepted';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM NOT LIKE 'Tanggal trip sudah%' THEN RAISE; END IF;
  END;
  RAISE NOTICE 'PASS voucher price, promo scope, idempotency, quota, schedule availability';
END $$;
RESET ROLE;

-- Catalog SQL validation should accept real month/year boundary.
DO $$
DECLARE
  v jsonb;
BEGIN
  SELECT published_payload INTO v FROM public.catalog_documents WHERE id='trip-1';
  v := jsonb_set(v,'{schedules,0,endDate}','"2026-11-02"');
  IF NOT public.validate_catalog_payload(v) THEN
    RAISE EXCEPTION 'Cross-month schedule rejected';
  END IF;
  v := jsonb_set(v,'{schedules,0,endDate}','"2026-10-26"');
  IF public.validate_catalog_payload(v) THEN
    RAISE EXCEPTION 'Backward schedule accepted';
  END IF;
  RAISE NOTICE 'PASS cross-month SQL validation';
END $$;
