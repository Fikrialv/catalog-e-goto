-- SECURITY: RLS is row-level; without a column grant restriction, anonymous
-- users can select draft_payload from a row whose publication_status is published.
-- Never allow public users to read unpublished draft JSON.
REVOKE SELECT ON TABLE public.catalog_documents FROM anon;
GRANT SELECT (
  id, slug, publication_status, published_payload,
  published_at, published_version
) ON TABLE public.catalog_documents TO anon;

-- The public-read policy only applies to anonymous requests.
-- Authenticated staff continue using the existing ADMIN/EDITOR SELECT policy.
DROP POLICY IF EXISTS "public sees published catalog"
  ON public.catalog_documents;
CREATE POLICY "public sees published catalog"
  ON public.catalog_documents
  FOR SELECT TO anon
  USING (publication_status = 'published' AND published_payload IS NOT NULL);

-- An ordinary authenticated user must not read draft_payload through the
-- permissive public policy. ADMIN/EDITOR have their own SELECT policy.
-- The public catalog service uses the publishable anon client.
