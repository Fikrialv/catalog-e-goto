-- Allow multi-day trips to cross calendar months while preserving date order and duplicate checks.
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
    key := to_char(start_date, 'YYYY-MM-DD') || ':' || coalesce(to_char(end_date, 'YYYY-MM-DD'), '');
    if key = any(seen) then return false; end if;
    seen := array_append(seen, key);
  end loop;
  return true;
end;
$$;
