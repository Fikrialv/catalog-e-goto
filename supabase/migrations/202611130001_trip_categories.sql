-- Add categories without modifying existing catalog documents.
CREATE TABLE IF NOT EXISTS public.trip_categories (
  id text PRIMARY KEY,
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+([-_][a-z0-9]+)*$'),
  name text NOT NULL CHECK (char_length(trim(name)) BETWEEN 2 AND 80),
  sort_order integer NOT NULL DEFAULT 1 CHECK (sort_order > 0),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.trip_categories (id,slug,name,sort_order,is_active)
VALUES ('mountain','mountain','Gunung',1,true),
       ('beach_waterfall','beach_waterfall','Pantai & Air Terjun',2,true)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.trip_categories ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.trip_categories FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.trip_categories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.trip_categories TO authenticated;

DROP POLICY IF EXISTS "public read active trip categories" ON public.trip_categories;
CREATE POLICY "public read active trip categories" ON public.trip_categories
FOR SELECT TO anon USING (is_active);

DROP POLICY IF EXISTS "admin read all trip categories" ON public.trip_categories;
CREATE POLICY "admin read all trip categories" ON public.trip_categories
FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.admin_profiles p
    WHERE p.user_id=(select auth.uid()) AND p.role IN ('ADMIN','EDITOR','VIEWER'))
);

DROP POLICY IF EXISTS "admin manage trip categories" ON public.trip_categories;
CREATE POLICY "admin manage trip categories" ON public.trip_categories
FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.admin_profiles p
  WHERE p.user_id=(select auth.uid()) AND p.role='ADMIN'))
WITH CHECK (EXISTS (SELECT 1 FROM public.admin_profiles p
  WHERE p.user_id=(select auth.uid()) AND p.role='ADMIN'));
