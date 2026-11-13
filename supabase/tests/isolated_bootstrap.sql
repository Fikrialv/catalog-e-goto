-- Ephemeral PostgreSQL fixture. NEVER execute this file against production.
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
CREATE SCHEMA IF NOT EXISTS auth;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN
    CREATE ROLE anon NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN
    CREATE ROLE authenticated NOLOGIN;
  END IF;
END $$;

CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated;

CREATE TABLE public.admin_profiles (
  user_id uuid PRIMARY KEY, role text NOT NULL
);
INSERT INTO public.admin_profiles VALUES
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','ADMIN');

GRANT SELECT ON public.admin_profiles TO authenticated;

CREATE TABLE public.catalog_documents (
  id text PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  publication_status text NOT NULL,
  draft_payload jsonb NOT NULL,
  published_payload jsonb,
  published_at timestamptz,
  published_version integer NOT NULL DEFAULT 0
);

CREATE TABLE public.vouchers (
  id text PRIMARY KEY,
  destination_id text NOT NULL REFERENCES public.catalog_documents(id),
  destination_name text NOT NULL,
  amount integer NOT NULL CHECK(amount>0),
  usage_limit integer NOT NULL CHECK(usage_limit>0),
  redeemed_count integer NOT NULL DEFAULT 0 CHECK(redeemed_count>=0 AND redeemed_count<=usage_limit),
  status text NOT NULL DEFAULT 'active'
);

CREATE TABLE public.voucher_redemptions (
  id text PRIMARY KEY,
  voucher_id text NOT NULL REFERENCES public.vouchers(id),
  destination_id text NOT NULL REFERENCES public.catalog_documents(id),
  session_id uuid NOT NULL,
  price_id text NOT NULL,
  amount integer NOT NULL CHECK(amount>0),
  final_amount integer NOT NULL CHECK(final_amount>=0),
  UNIQUE (voucher_id,destination_id,session_id)
);

ALTER TABLE public.catalog_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voucher_redemptions ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.catalog_documents TO anon, authenticated;
CREATE POLICY "public sees published catalog" ON public.catalog_documents
  FOR SELECT TO anon, authenticated USING (
    publication_status='published' AND published_payload IS NOT NULL
  );
CREATE POLICY "admins and editors can select catalog"
  ON public.catalog_documents FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.admin_profiles
    WHERE user_id=auth.uid() AND role IN ('ADMIN','EDITOR')
  ));

-- Old client-amount RPC exists solely to verify it gets revoked by migration.
CREATE FUNCTION public.redeem_catalog_voucher(
  p_voucher_id text, p_destination_id text,
  p_session_id uuid, p_price_id text, p_base_amount integer
) RETURNS TABLE(id text, voucher_id text, amount integer, final_amount integer)
LANGUAGE sql AS $$
  SELECT null::text, null::text, null::integer, null::integer WHERE false
$$;
GRANT EXECUTE ON FUNCTION public.redeem_catalog_voucher(text,text,uuid,text,integer)
  TO anon, authenticated;

INSERT INTO public.catalog_documents
  (id,slug,publication_status,draft_payload,published_payload,published_version)
VALUES
('trip-1','uji-trip','published',
 '{"slug":"uji-trip","secret":"PRIVATE_UNPUBLISHED_DRAFT"}'::jsonb,
 '{
   "slug":"uji-trip",
   "prices":[{"id":"meeting-jkt","label":"Jakarta","amount":500000}],
   "schedules":[
     {"id":"oct","startDate":"2026-10-27","endDate":"2026-10-28",
       "publicationStatus":"published","availabilityStatus":"available"},
     {"id":"nov","startDate":"2026-11-05","endDate":"2026-11-07",
       "publicationStatus":"published","availabilityStatus":"available"},
     {"id":"closed","startDate":"2026-11-12","endDate":null,
       "publicationStatus":"published","availabilityStatus":"full"},
     {"id":"draft-sched","startDate":"2026-11-19","endDate":null,
       "publicationStatus":"draft","availabilityStatus":"available"}
   ],
   "highlights":[{"id":"promo-oct","enabled":true,"scheduleId":"oct",
     "priceId":"meeting-jkt","discountType":"fixed",
     "discountValue":50000,"discountAmount":450000}]
 }'::jsonb,1),
('trip-draft','trip-rahasia','draft',
 '{"slug":"trip-rahasia","secret":"PRIVATE_DRAFT"}'::jsonb,NULL,0);

INSERT INTO public.vouchers (
  id,destination_id,destination_name,amount,usage_limit,redeemed_count,status
) VALUES (
 repeat('a',64),'trip-1','Uji Trip',25000,2,0,'active'
);
