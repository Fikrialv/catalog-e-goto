
-- Independent List Trip inventory. Catalog data and voucher relations remain unchanged.
create table if not exists public.list_trips (
  id text primary key,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  publication_status text not null default 'draft'
    check (publication_status in ('draft','published','archived')),
  draft_payload jsonb not null check (jsonb_typeof(draft_payload) = 'object'),
  published_payload jsonb check (published_payload is null or jsonb_typeof(published_payload) = 'object'),
  draft_version integer not null default 1 check (draft_version > 0),
  published_version integer not null default 0 check (published_version >= 0),
  published_at timestamptz,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint list_trips_published_snapshot check
    (publication_status <> 'published' or published_payload is not null)
);
create index if not exists list_trips_status_idx on public.list_trips(publication_status, updated_at desc);

create table if not exists public.list_trip_categories (
  id text primary key,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:[-_][a-z0-9]+)*$'),
  name text not null check (char_length(trim(name)) >= 2),
  sort_order integer not null default 1 check (sort_order > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
insert into public.list_trip_categories(id,slug,name,sort_order,is_active)
select id,slug,name,sort_order,is_active from public.trip_categories
on conflict (id) do nothing;

alter table public.list_trips enable row level security;
alter table public.list_trip_categories enable row level security;
revoke all on public.list_trips, public.list_trip_categories from anon, authenticated;
-- Anon cannot read draft_payload: row RLS alone does not hide columns.
grant select (id,slug,publication_status,published_payload,published_at,updated_at) on public.list_trips to anon;
grant select, insert, update, delete on public.list_trips to authenticated;
grant select on public.list_trip_categories to anon, authenticated;
grant insert, update, delete on public.list_trip_categories to authenticated;

create policy "public reads published list trips" on public.list_trips
  for select to anon using (publication_status='published' and published_payload is not null);
create policy "staff read all list trips" on public.list_trips
  for select to authenticated using (
    exists (select 1 from public.admin_profiles p where p.user_id=(select auth.uid())
      and p.role in ('ADMIN','EDITOR','VIEWER')));
create policy "editors insert list trips" on public.list_trips
  for insert to authenticated with check (
    exists (select 1 from public.admin_profiles p where p.user_id=(select auth.uid())
      and p.role in ('ADMIN','EDITOR')));
create policy "editors update list trips" on public.list_trips
  for update to authenticated using (
    exists (select 1 from public.admin_profiles p where p.user_id=(select auth.uid())
      and p.role in ('ADMIN','EDITOR')))
  with check (
    exists (select 1 from public.admin_profiles p where p.user_id=(select auth.uid())
      and p.role in ('ADMIN','EDITOR')));
create policy "editors delete list trips" on public.list_trips
  for delete to authenticated using (
    exists (select 1 from public.admin_profiles p where p.user_id=(select auth.uid())
      and p.role in ('ADMIN','EDITOR')));
create policy "public reads active list trip categories" on public.list_trip_categories
  for select to anon using (is_active);
create policy "staff reads all list trip categories" on public.list_trip_categories
  for select to authenticated using (
    exists (select 1 from public.admin_profiles p where p.user_id=(select auth.uid())
      and p.role in ('ADMIN','EDITOR','VIEWER')));
create policy "admins insert list trip categories" on public.list_trip_categories
  for insert to authenticated with check (
    exists (select 1 from public.admin_profiles p where p.user_id=(select auth.uid()) and p.role='ADMIN'));
create policy "admins update list trip categories" on public.list_trip_categories
  for update to authenticated using (
    exists (select 1 from public.admin_profiles p where p.user_id=(select auth.uid()) and p.role='ADMIN'))
  with check (
    exists (select 1 from public.admin_profiles p where p.user_id=(select auth.uid()) and p.role='ADMIN'));
create policy "admins delete list trip categories" on public.list_trip_categories
  for delete to authenticated using (
    exists (select 1 from public.admin_profiles p where p.user_id=(select auth.uid()) and p.role='ADMIN'));

insert into storage.buckets (id,name,public)
values ('list-trip-images','list-trip-images',true)
on conflict (id) do nothing;
create policy "list trip images public read" on storage.objects
  for select to anon,authenticated using (bucket_id='list-trip-images');
create policy "list trip images staff insert" on storage.objects
  for insert to authenticated with check (bucket_id='list-trip-images'
    and exists (select 1 from public.admin_profiles p where p.user_id=(select auth.uid())
      and p.role in ('ADMIN','EDITOR')));
create policy "list trip images staff update" on storage.objects
  for update to authenticated using (bucket_id='list-trip-images'
    and exists (select 1 from public.admin_profiles p where p.user_id=(select auth.uid())
      and p.role in ('ADMIN','EDITOR')))
  with check (bucket_id='list-trip-images'
    and exists (select 1 from public.admin_profiles p where p.user_id=(select auth.uid())
      and p.role in ('ADMIN','EDITOR')));
create policy "list trip images staff delete" on storage.objects
  for delete to authenticated using (bucket_id='list-trip-images'
    and exists (select 1 from public.admin_profiles p where p.user_id=(select auth.uid())
      and p.role in ('ADMIN','EDITOR')));

-- One-time independent copy of the two currently visible List Trip cards.
-- Subsequent Catalog changes never sync to this table.
with source as (
  select c.id, c.slug, c.publication_status,c.published_at,c.updated_at,c.published_version,
    jsonb_build_object(
      'id','list-'||c.id, 'slug',c.slug,
      'name',coalesce(c.published_payload->>'name','Trip'),
      'category',coalesce(c.published_payload->>'category','mountain'),
      'categories',case when jsonb_typeof(c.published_payload->'categories')='array'
        and jsonb_array_length(c.published_payload->'categories')>0 then c.published_payload->'categories'
        else jsonb_build_array(coalesce(c.published_payload->>'category','mountain')) end,
      'routes',coalesce(c.published_payload->'routes','[]'::jsonb),
      'location',coalesce(c.published_payload->>'location',''),
      'duration',coalesce(c.published_payload->>'duration',''),
      'description',coalesce(c.published_payload->>'description',''),
      'coverImage',coalesce(c.published_payload->'coverImage','{}'::jsonb),
      'gallery',coalesce(c.published_payload->'gallery','[]'::jsonb),
      'updatedAt',c.updated_at::text,
      'publicationStatus','published'
    ) as public_data
  from public.catalog_documents c
  where c.publication_status='published' and c.published_payload is not null
)
insert into public.list_trips(
  id,slug,publication_status,draft_payload,published_payload,
  draft_version,published_version,published_at,updated_at)
select 'list-'||id,slug,'published',
  public_data || '{"publicationStatus":"draft"}'::jsonb,
  public_data,1,1,coalesce(published_at,updated_at),updated_at
from source
on conflict (id) do nothing;
