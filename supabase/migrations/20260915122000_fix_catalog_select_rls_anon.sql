-- Keep the optimized catalog SELECT policy safe for anonymous readers.
-- The security-definer helper checks staff access without granting anon access
-- to admin_profiles.
create or replace function public.is_catalog_editor_or_admin()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, auth
as $$
  select exists (
    select 1
    from public.admin_profiles
    where user_id = (select auth.uid())
      and role in ('ADMIN', 'EDITOR')
  );
$$;

revoke all on function public.is_catalog_editor_or_admin() from public;
grant execute on function public.is_catalog_editor_or_admin() to anon, authenticated;

drop policy if exists "published catalog or privileged staff can select"
  on public.catalog_documents;

create policy "published catalog or privileged staff can select"
  on public.catalog_documents for select to anon, authenticated
  using (
    (publication_status = 'published' and published_payload is not null)
    or public.is_catalog_editor_or_admin()
  );
