-- One SELECT policy avoids evaluating two permissive policies for every row
-- while preserving the public-published and editor/admin access rules.
drop policy if exists "public sees published catalog" on public.catalog_documents;
drop policy if exists "admins and editors manage catalog" on public.catalog_documents;

create policy "published catalog or privileged staff can select"
  on public.catalog_documents for select to anon, authenticated
  using (
    (publication_status = 'published' and published_payload is not null)
    or exists (
      select 1 from public.admin_profiles
      where user_id = (select auth.uid()) and role in ('ADMIN', 'EDITOR')
    )
  );

create policy "admins and editors insert catalog"
  on public.catalog_documents for insert to authenticated
  with check (exists (
    select 1 from public.admin_profiles
    where user_id = (select auth.uid()) and role in ('ADMIN', 'EDITOR')
  ));

create policy "admins and editors update catalog"
  on public.catalog_documents for update to authenticated
  using (exists (
    select 1 from public.admin_profiles
    where user_id = (select auth.uid()) and role in ('ADMIN', 'EDITOR')
  ))
  with check (exists (
    select 1 from public.admin_profiles
    where user_id = (select auth.uid()) and role in ('ADMIN', 'EDITOR')
  ));

create policy "admins and editors delete catalog"
  on public.catalog_documents for delete to authenticated
  using (exists (
    select 1 from public.admin_profiles
    where user_id = (select auth.uid()) and role in ('ADMIN', 'EDITOR')
  ));
