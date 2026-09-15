-- These PL/pgSQL routines use stable JSON/date formatting operations.  Do not
-- label them IMMUTABLE: PostgreSQL's lint correctly rejects that declaration.
alter function public.normalize_catalog_highlights(jsonb) stable;

create or replace function public.validate_catalog_payload(payload jsonb)
returns boolean
language plpgsql
stable
as $$
declare
  item jsonb;
  key text;
  seen text[] := array[]::text[];
  start_date date;
  end_date date;
  normal_amount numeric;
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

  for item in select * from jsonb_array_elements(coalesce(payload->'highlights', '[]'::jsonb)) loop
    if coalesce(item->>'id', '') = '' or coalesce(item->>'scheduleId', '') = '' or coalesce(item->>'priceId', '') = '' then return false; end if;
    if not exists (
      select 1 from jsonb_array_elements(coalesce(payload->'schedules', '[]'::jsonb)) schedule
      where schedule->>'id' = item->>'scheduleId'
    ) then return false; end if;
    select (price->>'amount')::numeric into normal_amount
    from jsonb_array_elements(coalesce(payload->'prices', '[]'::jsonb)) price
    where price->>'id' = item->>'priceId'
    limit 1;
    if normal_amount is null or coalesce((item->>'discountAmount')::numeric, 0) <= 0 or (item->>'discountAmount')::numeric >= normal_amount then return false; end if;
  end loop;
  return true;
end;
$$;
