-- Align the persisted Catalog payload validator with the current editor.
-- The row's sort_order column is authoritative; legacy root payload.sortOrder is optional.
-- Draft price options may be incomplete; published prices must remain positive.
create or replace function public.validate_catalog_payload(payload jsonb)
returns boolean
language plpgsql
immutable
set search_path = pg_catalog, pg_temp
as $function$
declare
  item jsonb;
  key text;
  seen text[] := '{}';
  start_date date;
  end_date date;
  price_amount numeric;
  root_sort integer;
begin
  if payload is null or jsonb_typeof(payload) <> 'object' then return false; end if;
  if coalesce(payload->>'slug', '') !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then return false; end if;
  if payload ? 'sortOrder' then
    begin
      root_sort := (payload->>'sortOrder')::integer;
    exception when others then return false;
    end;
    if root_sort is null or root_sort < 0 then return false; end if;
  end if;
  for item in select * from jsonb_array_elements(coalesce(payload->'prices', '[]'::jsonb)) loop
    begin
      price_amount := (item->>'amount')::numeric;
    exception when others then return false;
    end;
    if price_amount is null or price_amount < 0 then return false; end if;
    if coalesce(payload->>'publicationStatus','draft') <> 'draft' and price_amount <= 0 then
      return false;
    end if;
  end loop;
  for item in select * from jsonb_array_elements(coalesce(payload->'schedules', '[]'::jsonb)) loop
    begin
      start_date := (item->>'startDate')::date;
      end_date := nullif(item->>'endDate', '')::date;
    exception when others then return false;
    end;
    if start_date is null then return false; end if;
    if end_date is not null and end_date < start_date then return false; end if;
    key := to_char(start_date, 'YYYY-MM-DD') || ':' || coalesce(to_char(end_date, 'YYYY-MM-DD'), '');
    if key = any(seen) then return false; end if;
    seen := array_append(seen, key);
  end loop;
  return true;
end;
$function$;