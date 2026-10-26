-- Shipments: a Lot sent from one City of a Player account to another of its own, held in Escrow (ADR 0048).
-- No price, no Friend, no expiry. The server never checks stocks, only the single claim, the cancellation and the limits.
-- Works for anonymous accounts: no Handle and no email are required. Every object created here is prefixed `urb_`.

create table public.urb_shipments (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  from_city_id uuid not null,
  to_city_id uuid not null,
  lot jsonb not null check (public.urb_lot_is_valid(lot)),
  state text not null default 'waiting' check (state in ('waiting', 'claimed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (from_city_id <> to_city_id)
);

create index urb_shipments_user_idx on public.urb_shipments (user_id, created_at);
create index urb_shipments_waiting_idx on public.urb_shipments (user_id, from_city_id) where state = 'waiting';

alter table public.urb_shipments enable row level security;
revoke all on public.urb_shipments from public, anon, authenticated;

create function public.urb_shipment_owner()
returns uuid
language plpgsql
stable
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'urb_unauthenticated' using errcode = '28000';
  end if;
  return v_user;
end;
$$;

revoke execute on function public.urb_shipment_owner() from public, anon, authenticated;

create function public.urb_create_shipment(p_id uuid, p_from uuid, p_to uuid, p_lot jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := public.urb_shipment_owner();
  v_existing public.urb_shipments;
  v_waiting integer;
  v_recent integer;
  v_wait numeric;
begin
  if p_id is null or p_from is null or p_to is null or p_from = p_to or not public.urb_lot_is_valid(p_lot) then
    raise exception 'urb_shipment_invalid' using errcode = 'P0001';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_user::text, 6));

  select * into v_existing from public.urb_shipments where id = p_id;
  if found then
    if v_existing.user_id <> v_user or v_existing.from_city_id <> p_from or v_existing.to_city_id <> p_to or v_existing.lot <> p_lot then
      raise exception 'urb_shipment_conflict' using errcode = 'P0001';
    end if;
    return p_id;
  end if;

  -- Both Cities must already be known to the account through their Cloud save.
  if not exists (select 1 from public.urb_saves where user_id = v_user and city_id = p_from)
     or not exists (select 1 from public.urb_saves where user_id = v_user and city_id = p_to) then
    raise exception 'urb_city_unknown' using errcode = 'P0001';
  end if;

  select count(*) into v_waiting from public.urb_shipments where user_id = v_user and from_city_id = p_from and state = 'waiting';
  if v_waiting >= 5 then
    raise exception 'urb_cap_shipments_waiting' using errcode = 'P0001';
  end if;

  select count(*), extract(epoch from min(created_at) + interval '1 day' - now())
    into v_recent, v_wait
    from public.urb_shipments where user_id = v_user and created_at > now() - interval '1 day';
  if v_recent >= 30 then
    raise exception 'urb_rate_limited' using errcode = 'P0001', detail = greatest(1, ceil(v_wait))::text;
  end if;

  insert into public.urb_shipments (id, user_id, from_city_id, to_city_id, lot) values (p_id, v_user, p_from, p_to, p_lot);
  return p_id;
end;
$$;

-- The Shipments still waiting, and the ones settled this week so a client whose ledger lacks the matching effect can replay it.
create function public.urb_list_shipments()
returns jsonb
language plpgsql
security definer
set search_path = ''
stable
as $$
declare
  v_user uuid := public.urb_shipment_owner();
begin
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', s.id,
      'fromCityId', s.from_city_id,
      'toCityId', s.to_city_id,
      'lot', s.lot,
      'state', s.state,
      'createdAt', s.created_at,
      'updatedAt', s.updated_at
    ) order by s.created_at)
    from public.urb_shipments s
    where s.user_id = v_user and (s.state = 'waiting' or s.updated_at > now() - interval '7 days')
  ), '[]'::jsonb);
end;
$$;

-- The destination City claims the Lot once. Answers with what to apply locally, again on a repeated claim.
create function public.urb_claim_shipment(p_id uuid, p_city uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := public.urb_shipment_owner();
  v_shipment public.urb_shipments;
begin
  select * into v_shipment from public.urb_shipments where id = p_id for update;
  if not found or v_shipment.user_id <> v_user or v_shipment.to_city_id is distinct from p_city or v_shipment.state = 'cancelled' then
    raise exception 'urb_shipment_unavailable' using errcode = 'P0002';
  end if;
  if v_shipment.state = 'waiting' then
    update public.urb_shipments set state = 'claimed', updated_at = now() where id = p_id;
  end if;
  return jsonb_build_object(
    'shipmentId', p_id,
    'effect', 'receive-lot',
    'lot', v_shipment.lot,
    'alreadyClaimed', v_shipment.state = 'claimed'
  );
end;
$$;

-- The sending City takes the Lot back as long as it has not been claimed. Answers again on a repeated cancellation.
create function public.urb_cancel_shipment(p_id uuid, p_city uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := public.urb_shipment_owner();
  v_shipment public.urb_shipments;
begin
  select * into v_shipment from public.urb_shipments where id = p_id for update;
  if not found or v_shipment.user_id <> v_user or v_shipment.from_city_id is distinct from p_city or v_shipment.state = 'claimed' then
    raise exception 'urb_shipment_unavailable' using errcode = 'P0002';
  end if;
  if v_shipment.state = 'waiting' then
    update public.urb_shipments set state = 'cancelled', updated_at = now() where id = p_id;
  end if;
  return jsonb_build_object(
    'shipmentId', p_id,
    'effect', 'return-lot',
    'lot', v_shipment.lot,
    'alreadyCancelled', v_shipment.state = 'cancelled'
  );
end;
$$;

-- Settled Shipments older than a week carry nothing to replay.
create function public.urb_purge_settled_shipments()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.urb_shipments where state <> 'waiting' and updated_at < now() - interval '7 days';
$$;

revoke execute on function public.urb_create_shipment(uuid, uuid, uuid, jsonb) from public, anon;
revoke execute on function public.urb_list_shipments() from public, anon;
revoke execute on function public.urb_claim_shipment(uuid, uuid) from public, anon;
revoke execute on function public.urb_cancel_shipment(uuid, uuid) from public, anon;
revoke execute on function public.urb_purge_settled_shipments() from public, anon, authenticated;
grant execute on function public.urb_create_shipment(uuid, uuid, uuid, jsonb) to authenticated;
grant execute on function public.urb_list_shipments() to authenticated;
grant execute on function public.urb_claim_shipment(uuid, uuid) to authenticated;
grant execute on function public.urb_cancel_shipment(uuid, uuid) to authenticated;

select cron.schedule('urb_purge_settled_shipments', '23 3 * * *', 'select public.urb_purge_settled_shipments()');
