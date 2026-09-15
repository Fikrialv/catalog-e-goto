-- Keep anonymous catalog reads isolated from staff authorization lookups.
-- Separate policies let PostgreSQL apply the anon policy without evaluating
-- admin_profiles, while authenticated staff retain their existing access.
drop policy if exists "published catalog or privileged staff can select"
  on public.catalog_documents;

create policy "public sees published catalog"
  on public.catalog_documents for select to anon, authenticated
  using (publication_status = 'published' and published_payload is not null);

create policy "admins and editors can select catalog"
  on public.catalog_documents for select to authenticated
  using (exists (
    select 1
    from public.admin_profiles
    where user_id = (select auth.uid())
      and role in ('ADMIN', 'EDITOR')
  ));

drop function if exists public.is_catalog_editor_or_admin();
