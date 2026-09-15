create extension if not exists pgcrypto;

create table if not exists public.admin_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('ADMIN', 'EDITOR', 'VIEWER')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.validate_catalog_payload(payload jsonb)
returns boolean
language plpgsql
immutable
as $$
declare
  item jsonb;
  key text;
  seen text[] := '{}';
  start_date date;
  end_date date;
begin
  if payload is null or jsonb_typeof(payload) <> 'object' then return false; end if;
  if coalesce(payload->>'slug', '') !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then return false; end if;
  if coalesce((payload->>'sortOrder')::int, -1) < 0 then return false; end if;
  for item in select * from jsonb_array_elements(coalesce(payload->'prices', '[]'::jsonb)) loop
    if coalesce((item->>'amount')::numeric, 0) <= 0 then return false; end if;
  end loop;
  for item in select * from jsonb_array_elements(coalesce(payload->'schedules', '[]'::jsonb)) loop
    begin
      start_date := (item->>'startDate')::date;
      end_date := nullif(item->>'endDate', '')::date;
    exception when others then return false;
    end;
    if end_date is not null and end_date < start_date then return false; end if;
    if end_date is not null and date_trunc('month', start_date) <> date_trunc('month', end_date) then return false; end if;
    key := to_char(start_date, 'YYYY-MM-DD') || ':' || coalesce(to_char(end_date, 'YYYY-MM-DD'), '');
    if key = any(seen) then return false; end if;
    seen := array_append(seen, key);
  end loop;
  return true;
end;
$$;

create table if not exists public.catalog_documents (
  id text primary key,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  publication_status text not null default 'draft' check (publication_status in ('draft', 'published', 'archived')),
  draft_payload jsonb not null check (public.validate_catalog_payload(draft_payload)),
  published_payload jsonb check (published_payload is null or public.validate_catalog_payload(published_payload)),
  draft_version integer not null default 1 check (draft_version >= 1),
  published_version integer not null default 0 check (published_version >= 0),
  published_at timestamptz,
  sort_order integer not null default 0 check (sort_order >= 0),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  action text not null check (action in ('LOGIN', 'CREATE', 'UPDATE', 'SAVE_DRAFT', 'PUBLISH', 'UNPUBLISH', 'ARCHIVE', 'RESTORE', 'DUPLICATE', 'REORDER')),
  before_data jsonb,
  after_data jsonb,
  user_id uuid references auth.users(id) on delete set null,
  entity_type text not null check (entity_type in ('destination', 'schedule', 'price')),
  entity_id text not null,
  published_version integer,
  created_at timestamptz not null default now()
);

create table if not exists public.slug_history (
  id uuid primary key default gen_random_uuid(),
  destination_id text not null references public.catalog_documents(id) on delete cascade,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create index if not exists catalog_documents_publication_status_idx on public.catalog_documents(publication_status);
create index if not exists catalog_documents_sort_order_idx on public.catalog_documents(sort_order);
create index if not exists catalog_documents_published_idx on public.catalog_documents(publication_status, sort_order);
create index if not exists audit_logs_entity_idx on public.audit_logs(entity_type, entity_id, created_at desc);
create index if not exists slug_history_slug_idx on public.slug_history(slug);

alter table public.admin_profiles enable row level security;
alter table public.catalog_documents enable row level security;
alter table public.audit_logs enable row level security;
alter table public.slug_history enable row level security;

revoke all on table public.admin_profiles, public.catalog_documents, public.audit_logs, public.slug_history from anon;
revoke all on table public.audit_logs, public.slug_history from authenticated;
grant select on table public.catalog_documents to anon, authenticated;
grant select on table public.admin_profiles to authenticated;
grant select, insert, update, delete on table public.catalog_documents to authenticated;
grant select on table public.audit_logs to authenticated;

drop policy if exists "public sees published catalog" on public.catalog_documents;
create policy "public sees published catalog" on public.catalog_documents for select to anon, authenticated using (publication_status = 'published' and published_payload is not null);

drop policy if exists "admins and editors manage catalog" on public.catalog_documents;
create policy "admins and editors manage catalog" on public.catalog_documents for all to authenticated
using (exists (select 1 from public.admin_profiles where user_id = (select auth.uid()) and role in ('ADMIN', 'EDITOR')))
with check (exists (select 1 from public.admin_profiles where user_id = (select auth.uid()) and role in ('ADMIN', 'EDITOR')));

drop policy if exists "users can view own admin profile" on public.admin_profiles;
create policy "users can view own admin profile" on public.admin_profiles for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists "admins can view audit" on public.audit_logs;
create policy "admins can view audit" on public.audit_logs for select to authenticated using (exists (select 1 from public.admin_profiles where user_id = (select auth.uid()) and role in ('ADMIN', 'EDITOR')));

drop policy if exists "admins can insert audit" on public.audit_logs;
create policy "admins can insert audit" on public.audit_logs for insert to authenticated with check (user_id = (select auth.uid()) and exists (select 1 from public.admin_profiles where user_id = (select auth.uid()) and role in ('ADMIN', 'EDITOR')));

drop policy if exists "admins can view slug history" on public.slug_history;
create policy "admins can view slug history" on public.slug_history for select to authenticated using (exists (select 1 from public.admin_profiles where user_id = (select auth.uid()) and role in ('ADMIN', 'EDITOR')));

comment on table public.catalog_documents is 'Draft and published snapshots. Public policy exposes published_payload only.';
comment on column public.catalog_documents.draft_payload is 'Private editable payload; never returned by anon public policy.';
comment on column public.catalog_documents.published_payload is 'Published immutable snapshot consumed by public catalog.';

insert into storage.buckets (id, name, public)
values ('catalog-images', 'catalog-images', true)
on conflict (id) do nothing;

drop policy if exists "catalog images public read" on storage.objects;
create policy "catalog images public read" on storage.objects for select to anon, authenticated using (bucket_id = 'catalog-images');

drop policy if exists "catalog images admin upload" on storage.objects;
create policy "catalog images admin upload" on storage.objects for insert to authenticated
with check (bucket_id = 'catalog-images' and exists (select 1 from public.admin_profiles where user_id = (select auth.uid()) and role in ('ADMIN', 'EDITOR')));

drop policy if exists "catalog images admin update" on storage.objects;
create policy "catalog images admin update" on storage.objects for update to authenticated
using (bucket_id = 'catalog-images' and exists (select 1 from public.admin_profiles where user_id = (select auth.uid()) and role in ('ADMIN', 'EDITOR')))
with check (bucket_id = 'catalog-images' and exists (select 1 from public.admin_profiles where user_id = (select auth.uid()) and role in ('ADMIN', 'EDITOR')));

drop policy if exists "catalog images admin delete" on storage.objects;
create policy "catalog images admin delete" on storage.objects for delete to authenticated
using (bucket_id = 'catalog-images' and exists (select 1 from public.admin_profiles where user_id = (select auth.uid()) and role in ('ADMIN', 'EDITOR')));
