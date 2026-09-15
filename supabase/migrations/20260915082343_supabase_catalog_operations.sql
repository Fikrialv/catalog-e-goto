create table public.catalog_events (
  id text primary key,
  event_type text not null check (event_type in ('destination_view', 'departure_selected', 'whatsapp_cta_clicked')),
  destination_id text not null references public.catalog_documents(id) on delete cascade,
  destination_slug text not null check (char_length(destination_slug) between 2 and 120),
  destination_name text not null check (char_length(destination_name) between 1 and 200),
  departure_id text,
  departure_label text,
  session_id uuid not null,
  created_at timestamptz not null default now()
);

create index catalog_events_created_at_idx on public.catalog_events(created_at desc);
create index catalog_events_destination_idx on public.catalog_events(destination_id, created_at desc);

create table public.vouchers (
  id text primary key check (id ~ '^[a-f0-9]{64}$'),
  code_preview text not null check (char_length(code_preview) between 5 and 16),
  destination_id text not null references public.catalog_documents(id) on delete restrict,
  destination_name text not null check (char_length(destination_name) between 1 and 200),
  amount integer not null check (amount > 0),
  usage_limit integer not null check (usage_limit > 0),
  redeemed_count integer not null default 0 check (redeemed_count >= 0 and redeemed_count <= usage_limit),
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now()
);

create table public.voucher_redemptions (
  id text primary key,
  voucher_id text not null references public.vouchers(id) on delete restrict,
  destination_id text not null references public.catalog_documents(id) on delete restrict,
  session_id uuid not null,
  price_id text not null,
  amount integer not null check (amount > 0),
  final_amount integer not null check (final_amount >= 0),
  created_at timestamptz not null default now(),
  unique (voucher_id, destination_id, session_id)
);

create index voucher_redemptions_voucher_idx on public.voucher_redemptions(voucher_id, created_at desc);

alter table public.catalog_events enable row level security;
alter table public.vouchers enable row level security;
alter table public.voucher_redemptions enable row level security;

revoke all on table public.catalog_events, public.vouchers, public.voucher_redemptions from anon, authenticated;
grant insert on table public.catalog_events to anon, authenticated;
grant select on table public.catalog_events, public.vouchers, public.voucher_redemptions to authenticated;
grant insert on table public.vouchers to authenticated;

create policy "public records valid catalog events" on public.catalog_events
  for insert to anon, authenticated
  with check (
    event_type in ('destination_view', 'departure_selected', 'whatsapp_cta_clicked')
    and char_length(destination_slug) between 2 and 120
    and char_length(destination_name) between 1 and 200
  );

create policy "admins view catalog events" on public.catalog_events
  for select to authenticated
  using (exists (
    select 1 from public.admin_profiles
    where user_id = (select auth.uid()) and role in ('ADMIN', 'EDITOR')
  ));

create policy "admins view vouchers" on public.vouchers
  for select to authenticated
  using (exists (
    select 1 from public.admin_profiles
    where user_id = (select auth.uid()) and role in ('ADMIN', 'EDITOR', 'VIEWER')
  ));

create policy "admins create vouchers" on public.vouchers
  for insert to authenticated
  with check (exists (
    select 1 from public.admin_profiles
    where user_id = (select auth.uid()) and role in ('ADMIN', 'EDITOR')
  ));

create policy "admins view voucher redemptions" on public.voucher_redemptions
  for select to authenticated
  using (exists (
    select 1 from public.admin_profiles
    where user_id = (select auth.uid()) and role in ('ADMIN', 'EDITOR')
  ));

create or replace function public.redeem_catalog_voucher(
  p_voucher_id text,
  p_destination_id text,
  p_session_id uuid,
  p_price_id text,
  p_base_amount integer
)
returns table (id text, voucher_id text, amount integer, final_amount integer)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  voucher_row public.vouchers%rowtype;
  existing_row public.voucher_redemptions%rowtype;
  next_id text;
begin
  select * into existing_row
  from public.voucher_redemptions
  where voucher_id = p_voucher_id
    and destination_id = p_destination_id
    and session_id = p_session_id;

  if found then
    return query select existing_row.id, existing_row.voucher_id, existing_row.amount, existing_row.final_amount;
    return;
  end if;

  update public.vouchers
  set redeemed_count = redeemed_count + 1
  where id = p_voucher_id
    and destination_id = p_destination_id
    and status = 'active'
    and redeemed_count < usage_limit
  returning * into voucher_row;

  if not found then
    raise exception 'Kode voucher tidak berlaku untuk trip ini atau kuota telah habis.';
  end if;

  next_id := encode(digest(p_voucher_id || ':' || p_destination_id || ':' || p_session_id::text, 'sha256'), 'hex');
  insert into public.voucher_redemptions (
    id, voucher_id, destination_id, session_id, price_id, amount, final_amount
  ) values (
    next_id, p_voucher_id, p_destination_id, p_session_id, p_price_id,
    voucher_row.amount, greatest(0, p_base_amount - voucher_row.amount)
  );

  return query select next_id, p_voucher_id, voucher_row.amount, greatest(0, p_base_amount - voucher_row.amount);
end;
$$;

revoke all on function public.redeem_catalog_voucher(text, text, uuid, text, integer) from public;
grant execute on function public.redeem_catalog_voucher(text, text, uuid, text, integer) to anon, authenticated;
