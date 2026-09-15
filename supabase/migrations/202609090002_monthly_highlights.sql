-- Catalog ordering is derived from the earliest published departure. It is not
-- editable state, so remove the legacy database order once this migration runs.
drop index if exists public.catalog_documents_sort_order_idx;
drop index if exists public.catalog_documents_published_idx;
alter table public.catalog_documents drop column if exists sort_order;
create index if not exists catalog_documents_published_idx
  on public.catalog_documents(publication_status, published_at desc);

-- Payloads now support many optional highlights. Each highlight references a
-- schedule and price option stored in the same published snapshot.
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
