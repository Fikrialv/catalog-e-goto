-- Validate category migration in a disposable PostgreSQL database only.
DO $$
BEGIN
  IF (SELECT count(*) FROM public.trip_categories) <> 2 THEN
    RAISE EXCEPTION 'Expected two backfilled legacy categories';
  END IF;
  IF NOT has_table_privilege('anon','public.trip_categories','SELECT') THEN
    RAISE EXCEPTION 'Public must be able to read active categories';
  END IF;
  IF has_table_privilege('anon','public.trip_categories','INSERT') THEN
    RAISE EXCEPTION 'Public can create trip categories';
  END IF;
  RAISE NOTICE 'PASS category seed and table grants';
END $$;

SET ROLE anon;
DO $$
BEGIN
  IF (SELECT count(*) FROM public.trip_categories) <> 2 THEN
    RAISE EXCEPTION 'Anon category select failed';
  END IF;
END $$;
RESET ROLE;

SELECT set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',false);
SET ROLE authenticated;
INSERT INTO public.trip_categories(id,slug,name,sort_order,is_active)
VALUES ('camping','camping','Camping',3,true);
UPDATE public.trip_categories SET name='Camping & Hiking'
WHERE id='camping';
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.trip_categories
    WHERE slug='camping' AND name='Camping & Hiking') THEN
    RAISE EXCEPTION 'ADMIN cannot manage categories';
  END IF;
END $$;
RESET ROLE;

SET ROLE anon;
DO $$
BEGIN
  IF (SELECT count(*) FROM public.trip_categories) <> 3 THEN
    RAISE EXCEPTION 'New active category is not public';
  END IF;
END $$;
RESET ROLE;

UPDATE public.trip_categories SET is_active=false WHERE id='camping';
SET ROLE anon;
DO $$
BEGIN
  IF (SELECT count(*) FROM public.trip_categories) <> 2 THEN
    RAISE EXCEPTION 'Inactive category visible to anon';
  END IF;
END $$;
RESET ROLE;
