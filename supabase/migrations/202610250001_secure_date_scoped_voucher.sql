-- Voucher totals must come from the *published* price and the selected
-- published/available departure. Never accept a client-supplied base price.
-- Existing redemption history is preserved; legacy rows have NULL schedule_id.
ALTER TABLE public.voucher_redemptions
  ADD COLUMN IF NOT EXISTS schedule_id text;

CREATE OR REPLACE FUNCTION public.redeem_catalog_voucher(
  p_voucher_id text,
  p_destination_id text,
  p_session_id uuid,
  p_price_id text,
  p_schedule_id text
)
RETURNS TABLE (id text, voucher_id text, amount integer, final_amount integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, extensions, pg_temp
AS $$
DECLARE
  doc public.catalog_documents%rowtype;
  voucher_row public.vouchers%rowtype;
  existing_row public.voucher_redemptions%rowtype;
  base_amount integer;
  promo_amount integer;
  offer jsonb;
  schedule jsonb;
  next_id text;
BEGIN
  IF p_session_id IS NULL OR coalesce(p_schedule_id,'') = '' THEN
    RAISE EXCEPTION 'Jadwal keberangkatan wajib dipilih.';
  END IF;
  SELECT * INTO doc FROM public.catalog_documents
    WHERE catalog_documents.id = p_destination_id
      AND publication_status = 'published'
      AND published_payload IS NOT NULL;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Trip tidak tersedia.';
  END IF;

  SELECT item INTO schedule
  FROM jsonb_array_elements(coalesce(doc.published_payload->'schedules', '[]'::jsonb)) AS item
  WHERE item->>'id' = p_schedule_id LIMIT 1;
  IF schedule IS NULL OR schedule->>'publicationStatus' <> 'published'
    OR schedule->>'availabilityStatus' <> 'available' THEN
    RAISE EXCEPTION 'Tanggal trip sudah tidak tersedia.';
  END IF;

  SELECT (item->>'amount')::integer INTO base_amount
  FROM jsonb_array_elements(coalesce(doc.published_payload->'prices', '[]'::jsonb)) AS item
  WHERE item->>'id' = p_price_id LIMIT 1;
  IF base_amount IS NULL OR base_amount <= 0 THEN
    RAISE EXCEPTION 'Harga trip tidak valid.';
  END IF;

  -- Apply only enabled promotions linked to this exact schedule.
  -- Fixed nominal promotion currently applies to all meeting points.
  promo_amount := base_amount;
  FOR offer IN SELECT item
    FROM jsonb_array_elements(coalesce(doc.published_payload->'highlights', '[]'::jsonb)) AS item
  LOOP
    IF offer->>'enabled' = 'true'
      AND offer->>'scheduleId' = p_schedule_id
      AND offer->>'discountType' = 'fixed'
      AND (offer->>'discountValue') ~ '^[0-9]+$'
      AND (offer->>'discountValue')::integer > 0
      AND (offer->>'discountValue')::integer < base_amount THEN
      promo_amount := LEAST(promo_amount,
        base_amount - (offer->>'discountValue')::integer);
    END IF;
  END LOOP;

  -- Preserve idempotency: a session cannot spend one voucher on two dates
  -- or two meeting points. Never re-use an old redemption at a different price.
  SELECT * INTO existing_row FROM public.voucher_redemptions AS vr
    WHERE vr.voucher_id = p_voucher_id
      AND vr.destination_id = p_destination_id
      AND vr.session_id = p_session_id;
  IF FOUND THEN
    IF existing_row.price_id IS DISTINCT FROM p_price_id
      OR existing_row.schedule_id IS DISTINCT FROM p_schedule_id THEN
      RAISE EXCEPTION 'Voucher sudah dipakai untuk pilihan trip lain dalam sesi ini.';
    END IF;
    RETURN QUERY SELECT existing_row.id, existing_row.voucher_id,
      existing_row.amount, existing_row.final_amount;
    RETURN;
  END IF;

  -- Atomic quota decrement. Concurrent requests cannot exceed usage_limit.
  UPDATE public.vouchers AS v
  SET redeemed_count = v.redeemed_count + 1
  WHERE v.id = p_voucher_id
    AND v.destination_id = p_destination_id
    AND v.status = 'active'
    AND v.redeemed_count < v.usage_limit
  RETURNING v.* INTO voucher_row;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Kode voucher tidak berlaku atau limit pemakaian habis.';
  END IF;

  next_id := encode(extensions.digest(
    p_voucher_id || ':' || p_destination_id || ':' || p_session_id::text,
    'sha256'), 'hex');
  INSERT INTO public.voucher_redemptions (
    id, voucher_id, destination_id, session_id, price_id, schedule_id,
    amount, final_amount
  ) VALUES (
    next_id, p_voucher_id, p_destination_id, p_session_id, p_price_id,
    p_schedule_id, voucher_row.amount,
    GREATEST(0, promo_amount - voucher_row.amount)
  );

  RETURN QUERY SELECT next_id, p_voucher_id, voucher_row.amount,
    GREATEST(0, promo_amount - voucher_row.amount);
END;
$$;

REVOKE ALL ON FUNCTION public.redeem_catalog_voucher(text,text,uuid,text,text)
  FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.redeem_catalog_voucher(text,text,uuid,text,text)
  TO anon, authenticated;

-- Retire the old client-trusted base-amount RPC entry point.
REVOKE ALL ON FUNCTION public.redeem_catalog_voucher(text,text,uuid,text,integer)
  FROM PUBLIC, anon, authenticated;
