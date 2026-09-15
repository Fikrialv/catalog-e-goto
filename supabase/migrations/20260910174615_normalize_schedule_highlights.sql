-- A highlight is a discount selection from a catalog departure. It never owns
-- a second date or itinerary, which prevents stale promotional content.
create or replace function public.normalize_catalog_highlights(payload jsonb)
returns jsonb
language plpgsql
immutable
as $$
declare
  source_offer jsonb;
  normalized_offers jsonb := '[]'::jsonb;
  schedule_id text;
begin
  if payload is null or jsonb_typeof(payload) <> 'object' then return payload; end if;

  for source_offer in
    select * from jsonb_array_elements(
      case
        when jsonb_typeof(payload->'highlights') = 'array' and jsonb_array_length(payload->'highlights') > 0
          then payload->'highlights'
        when jsonb_typeof(payload->'highlight') = 'object'
          then jsonb_build_array(payload->'highlight')
        else '[]'::jsonb
      end
    )
  loop
    schedule_id := coalesce(
      source_offer->>'scheduleId',
      (
        select schedule->>'id'
        from jsonb_array_elements(coalesce(payload->'schedules', '[]'::jsonb)) schedule
        where schedule->>'startDate' = source_offer->>'date'
        limit 1
      )
    );
    normalized_offers := normalized_offers || jsonb_build_array(
      (source_offer - 'date' - 'itinerary' - 'sortOrder') || jsonb_build_object(
        'id', coalesce(source_offer->>'id', coalesce(payload->>'id', 'destination') || '-highlight-' || (jsonb_array_length(normalized_offers) + 1)::text),
        'scheduleId', schedule_id
      )
    );
  end loop;

  return jsonb_set(
    payload - 'highlight' - 'sortOrder',
    '{highlights}',
    normalized_offers,
    true
  );
end;
$$;

update public.catalog_documents
set
  draft_payload = public.normalize_catalog_highlights(draft_payload),
  published_payload = case
    when published_payload is null then null
    else public.normalize_catalog_highlights(published_payload)
  end;

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

revoke execute on function public.normalize_catalog_highlights(jsonb) from public;
