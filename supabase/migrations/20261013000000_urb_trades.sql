-- Multiplayer, delivery 3: Trade offers between Friends, held in Escrow (ADR 0025).
-- The server never checks stocks or Urbs; it guarantees single claims, expiry and the limits.
-- Every object created here is prefixed `urb_`.

create table public.urb_trade_offers (
  id uuid primary key,
  sender_id uuid references public.urb_profiles (user_id) on delete set null,
  recipient_id uuid references public.urb_profiles (user_id) on delete set null,
  lot jsonb not null,
  price integer not null check (price between 0 and 10000),
  state text not null default 'open' check (state in ('open', 'accepted', 'refused', 'cancelled', 'expired', 'lapsed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null,
  accepted_at timestamptz,
  claim_deadline timestamptz,
  lot_claimed_at timestamptz,
  payment_claimed_at timestamptz
);

create index urb_trade_offers_sender_idx on public.urb_trade_offers (sender_id, created_at);
create index urb_trade_offers_recipient_idx on public.urb_trade_offers (recipient_id);
create index urb_trade_offers_open_idx on public.urb_trade_offers (expires_at) where state = 'open';

alter table public.urb_trade_offers enable row level security;
revoke all on public.urb_trade_offers from public, anon, authenticated;

-- A Lot is 1 to 10 distinct items, quantity 1 to 9999 each.
create function public.urb_lot_is_valid(p_lot jsonb)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_line jsonb;
  v_items text[] := array[]::text[];
  v_item text;
begin
  if p_lot is null or jsonb_typeof(p_lot) <> 'array' or jsonb_array_length(p_lot) not between 1 and 10 then
    return false;
  end if;
  for v_line in select * from jsonb_array_elements(p_lot) loop
    if jsonb_typeof(v_line) <> 'object' or jsonb_typeof(v_line -> 'item') <> 'string' or jsonb_typeof(v_line -> 'quantity') <> 'number' then
      return false;
    end if;
    v_item := v_line ->> 'item';
    if v_item !~ '^[A-Za-z0-9_-]{1,40}$' or v_item = any (v_items) then
      return false;
    end if;
    if (v_line ->> 'quantity') !~ '^[1-9][0-9]{0,3}$' then
      return false;
    end if;
    v_items := v_items || v_item;
  end loop;
  return true;
end;
$$;

-- Moves an offer past its deadline to expired (open) or lapsed (accepted, Lot never claimed).
create function public.urb_settle_offer(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_offer public.urb_trade_offers;
begin
  select * into v_offer from public.urb_trade_offers where id = p_id for update;
  if not found then
    return;
  end if;
  if v_offer.state = 'open' and v_offer.expires_at <= now() then
    update public.urb_trade_offers set state = 'expired', updated_at = now() where id = p_id;
  elsif v_offer.state = 'accepted' and v_offer.lot_claimed_at is null and v_offer.claim_deadline <= now() then
    update public.urb_trade_offers set state = 'lapsed', updated_at = now() where id = p_id;
  else
    return;
  end if;
  if v_offer.sender_id is not null then perform public.urb_bump_social(v_offer.sender_id); end if;
  if v_offer.recipient_id is not null then perform public.urb_bump_social(v_offer.recipient_id); end if;
end;
$$;

-- Closes an offer now: an open one is cancelled, an accepted one whose Lot is unclaimed lapses.
create function public.urb_close_offer(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_offer public.urb_trade_offers;
  v_next text;
begin
  select * into v_offer from public.urb_trade_offers where id = p_id for update;
  if not found then
    return;
  end if;
  v_next := case
    when v_offer.state = 'open' then 'cancelled'
    when v_offer.state = 'accepted' and v_offer.lot_claimed_at is null then 'lapsed'
    else null
  end;
  if v_next is null then
    return;
  end if;
  update public.urb_trade_offers set state = v_next, updated_at = now() where id = p_id;
  if v_offer.sender_id is not null then perform public.urb_bump_social(v_offer.sender_id); end if;
  if v_offer.recipient_id is not null then perform public.urb_bump_social(v_offer.recipient_id); end if;
end;
$$;

create function public.urb_close_offers_between(p_a uuid, p_b uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  for v_id in
    select id from public.urb_trade_offers
    where ((sender_id = p_a and recipient_id = p_b) or (sender_id = p_b and recipient_id = p_a)) and state in ('open', 'accepted')
  loop
    perform public.urb_close_offer(v_id);
  end loop;
end;
$$;

create function public.urb_expire_offers()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  for v_id in
    select id from public.urb_trade_offers
    where (state = 'open' and expires_at <= now())
       or (state = 'accepted' and lot_claimed_at is null and claim_deadline <= now())
  loop
    perform public.urb_settle_offer(v_id);
  end loop;
  delete from public.urb_trade_offers where updated_at < now() - interval '30 days' and state <> 'open';
  delete from public.urb_trade_offers where sender_id is null and recipient_id is null;
end;
$$;

create function public.urb_create_trade_offer(p_id uuid, p_to uuid, p_lot jsonb, p_price integer)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := public.urb_social_member();
  v_existing public.urb_trade_offers;
  v_open integer;
  v_recent integer;
  v_wait numeric;
begin
  if p_id is null or not public.urb_lot_is_valid(p_lot) or p_price is null or p_price not between 0 and 10000 then
    raise exception 'urb_trade_invalid' using errcode = 'P0001';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_user::text, 4));

  select * into v_existing from public.urb_trade_offers where id = p_id;
  if found then
    if v_existing.sender_id is distinct from v_user or v_existing.recipient_id is distinct from p_to
       or v_existing.lot <> p_lot or v_existing.price <> p_price then
      raise exception 'urb_trade_conflict' using errcode = 'P0001';
    end if;
    return p_id;
  end if;

  if p_to = v_user then
    raise exception 'urb_trade_invalid' using errcode = 'P0001';
  end if;
  if not public.urb_are_friends(v_user, p_to) then
    raise exception 'urb_not_friends' using errcode = 'P0001';
  end if;

  select count(*) into v_open from public.urb_trade_offers where sender_id = v_user and state = 'open' and expires_at > now();
  if v_open >= 5 then
    raise exception 'urb_cap_trades_open' using errcode = 'P0001';
  end if;

  select count(*), extract(epoch from min(created_at) + interval '1 day' - now())
    into v_recent, v_wait
    from public.urb_trade_offers where sender_id = v_user and created_at > now() - interval '1 day';
  if v_recent >= 30 then
    raise exception 'urb_rate_limited' using errcode = 'P0001', detail = greatest(1, ceil(v_wait))::text;
  end if;

  insert into public.urb_trade_offers (id, sender_id, recipient_id, lot, price, expires_at)
    values (p_id, v_user, p_to, p_lot, p_price, now() + interval '72 hours');
  perform public.urb_bump_social(v_user);
  perform public.urb_bump_social(p_to);
  return p_id;
end;
$$;

create function public.urb_accept_trade_offer(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := public.urb_social_member();
  v_offer public.urb_trade_offers;
begin
  perform public.urb_settle_offer(p_id);
  select * into v_offer from public.urb_trade_offers where id = p_id for update;
  if not found or v_offer.recipient_id is distinct from v_user or v_offer.state <> 'open' then
    raise exception 'urb_trade_unavailable' using errcode = 'P0002';
  end if;
  update public.urb_trade_offers
    set state = 'accepted', accepted_at = now(), claim_deadline = now() + interval '72 hours', updated_at = now()
    where id = p_id;
  perform public.urb_bump_social(v_user);
  if v_offer.sender_id is not null then perform public.urb_bump_social(v_offer.sender_id); end if;
end;
$$;

-- The recipient refuses, or the sender cancels, an open offer.
create function public.urb_decline_trade_offer(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := public.urb_social_member();
  v_offer public.urb_trade_offers;
begin
  perform public.urb_settle_offer(p_id);
  select * into v_offer from public.urb_trade_offers where id = p_id for update;
  if not found or v_offer.state <> 'open'
     or (v_offer.sender_id is distinct from v_user and v_offer.recipient_id is distinct from v_user) then
    raise exception 'urb_trade_unavailable' using errcode = 'P0002';
  end if;
  update public.urb_trade_offers
    set state = case when v_offer.recipient_id = v_user then 'refused' else 'cancelled' end, updated_at = now()
    where id = p_id;
  if v_offer.sender_id is not null then perform public.urb_bump_social(v_offer.sender_id); end if;
  if v_offer.recipient_id is not null then perform public.urb_bump_social(v_offer.recipient_id); end if;
end;
$$;

-- Claims the Lot or the payment of an offer. Answers with what to apply locally, again on a repeated claim,
-- so a client that lost the first answer can still credit it (its ledger credits it only once).
create function public.urb_claim_trade(p_id uuid, p_slot text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := public.urb_social_member();
  v_offer public.urb_trade_offers;
  v_owner uuid;
  v_effect text;
  v_claimed timestamptz;
begin
  if p_slot not in ('lot', 'payment') then
    raise exception 'urb_trade_unavailable' using errcode = 'P0002';
  end if;
  perform public.urb_settle_offer(p_id);
  select * into v_offer from public.urb_trade_offers where id = p_id for update;
  if not found then
    raise exception 'urb_trade_unavailable' using errcode = 'P0002';
  end if;

  if p_slot = 'lot' then
    v_owner := case when v_offer.state = 'accepted' then v_offer.recipient_id
                    when v_offer.state in ('refused', 'cancelled', 'expired', 'lapsed') then v_offer.sender_id end;
    v_effect := case when v_offer.state = 'accepted' then 'receive-lot' else 'return-lot' end;
    v_claimed := v_offer.lot_claimed_at;
  else
    -- The sender is paid only once the recipient has the Lot, so a Lot never lapses after its payment was taken.
    v_owner := case when v_offer.state = 'accepted' and v_offer.lot_claimed_at is not null then v_offer.sender_id
                    when v_offer.state = 'lapsed' then v_offer.recipient_id end;
    v_effect := case when v_offer.state = 'accepted' then 'receive-payment' else 'return-payment' end;
    v_claimed := v_offer.payment_claimed_at;
  end if;

  if v_owner is null or v_owner <> v_user then
    raise exception 'urb_trade_unavailable' using errcode = 'P0002';
  end if;

  if v_claimed is null then
    if p_slot = 'lot' then
      update public.urb_trade_offers set lot_claimed_at = now(), updated_at = now() where id = p_id;
    else
      update public.urb_trade_offers set payment_claimed_at = now(), updated_at = now() where id = p_id;
    end if;
    perform public.urb_bump_social(v_user);
    if v_offer.sender_id is not null and v_offer.sender_id <> v_user then perform public.urb_bump_social(v_offer.sender_id); end if;
    if v_offer.recipient_id is not null and v_offer.recipient_id <> v_user then perform public.urb_bump_social(v_offer.recipient_id); end if;
  end if;

  return jsonb_build_object(
    'offerId', v_offer.id,
    'slot', p_slot,
    'effect', v_effect,
    'alreadyClaimed', v_claimed is not null,
    'lot', case when p_slot = 'lot' then v_offer.lot end,
    'urbs', case when p_slot = 'payment' then v_offer.price end
  );
end;
$$;

-- The offers a player still has to deal with, for the social state.
create function public.urb_offers_json(p_user uuid)
returns jsonb
language sql
security definer
set search_path = ''
stable
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', o.id,
    'role', case when o.sender_id = p_user then 'sender' else 'recipient' end,
    'peerId', peer.user_id,
    'peerHandle', peer.handle,
    'lot', o.lot,
    'price', o.price,
    'state', o.state,
    'createdAt', o.created_at,
    'expiresAt', o.expires_at,
    'claimDeadline', o.claim_deadline,
    'claimable', (
      select coalesce(jsonb_agg(slot), '[]'::jsonb) from (
        select 'lot' as slot where o.lot_claimed_at is null and (
          (o.state = 'accepted' and o.recipient_id = p_user)
          or (o.state in ('refused', 'cancelled', 'expired', 'lapsed') and o.sender_id = p_user))
        union all
        select 'payment' where o.payment_claimed_at is null and (
          (o.state = 'accepted' and o.lot_claimed_at is not null and o.sender_id = p_user)
          or (o.state = 'lapsed' and o.recipient_id = p_user))
      ) s
    )
  ) order by o.created_at desc), '[]'::jsonb)
  from public.urb_trade_offers o
  join public.urb_profiles peer on peer.user_id = case when o.sender_id = p_user then o.recipient_id else o.sender_id end
  where p_user in (o.sender_id, o.recipient_id)
    and (
      o.state = 'open'
      or (o.state = 'accepted' and o.lot_claimed_at is null)
      or (o.lot_claimed_at is null and o.state in ('refused', 'cancelled', 'expired', 'lapsed') and o.sender_id = p_user)
      or (o.state = 'accepted' and o.lot_claimed_at is not null and o.payment_claimed_at is null and o.sender_id = p_user)
      or (o.state = 'lapsed' and o.payment_claimed_at is null and o.recipient_id = p_user)
    );
$$;

-- The social state now carries the offers; it settles expired ones first, so it is no longer stable.
create or replace function public.urb_list_social(p_cursor bigint default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := public.urb_social_member();
  v_me public.urb_profiles;
  v_id uuid;
begin
  for v_id in
    select id from public.urb_trade_offers
    where v_user in (sender_id, recipient_id)
      and ((state = 'open' and expires_at <= now()) or (state = 'accepted' and lot_claimed_at is null and claim_deadline <= now()))
  loop
    perform public.urb_settle_offer(v_id);
  end loop;

  select * into v_me from public.urb_profiles where user_id = v_user;

  if p_cursor is not null and p_cursor = v_me.social_revision then
    return jsonb_build_object('revision', v_me.social_revision, 'changed', false);
  end if;

  return jsonb_build_object(
    'revision', v_me.social_revision,
    'changed', true,
    'handle', v_me.handle,
    'findable', v_me.findable,
    'handleChangedAt', v_me.handle_changed_at,
    'friends', coalesce((
      select jsonb_agg(jsonb_build_object(
        'userId', o.user_id, 'handle', o.handle, 'since', f.updated_at,
        'unread', (select count(*) from public.urb_messages m where m.recipient_id = v_user and m.sender_id = o.user_id and m.read_at is null),
        'lastMessageAt', (select max(m.created_at) from public.urb_messages m
                          where (m.sender_id = v_user and m.recipient_id = o.user_id) or (m.sender_id = o.user_id and m.recipient_id = v_user))
      ) order by lower(o.handle))
      from public.urb_friendships f
      join public.urb_profiles o on o.user_id = case when f.user_low = v_user then f.user_high else f.user_low end
      where f.state = 'accepted' and v_user in (f.user_low, f.user_high)
    ), '[]'::jsonb),
    'incoming', coalesce((
      select jsonb_agg(jsonb_build_object('userId', o.user_id, 'handle', o.handle, 'at', f.created_at) order by f.created_at)
      from public.urb_friendships f
      join public.urb_profiles o on o.user_id = f.actor_id
      where f.state = 'pending' and f.actor_id <> v_user and v_user in (f.user_low, f.user_high)
    ), '[]'::jsonb),
    'outgoing', coalesce((
      select jsonb_agg(jsonb_build_object(
        'userId', o.user_id, 'handle', o.handle, 'at', f.created_at) order by f.created_at)
      from public.urb_friendships f
      join public.urb_profiles o on o.user_id = case when f.user_low = v_user then f.user_high else f.user_low end
      where f.state = 'pending' and f.actor_id = v_user
    ), '[]'::jsonb),
    'blocked', coalesce((
      select jsonb_agg(jsonb_build_object('userId', o.user_id, 'handle', o.handle) order by lower(o.handle))
      from public.urb_friendships f
      join public.urb_profiles o on o.user_id = case when f.user_low = v_user then f.user_high else f.user_low end
      where f.state = 'blocked' and f.actor_id = v_user
    ), '[]'::jsonb),
    'offers', public.urb_offers_json(v_user)
  );
end;
$$;

-- The Conversation and the offers end with the Friendship.
create or replace function public.urb_remove_friend(p_user uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := public.urb_social_member();
begin
  delete from public.urb_friendships
    where user_low = least(v_user, p_user) and user_high = greatest(v_user, p_user) and state = 'accepted';
  if not found then
    return;
  end if;
  perform public.urb_delete_conversation(v_user, p_user);
  perform public.urb_close_offers_between(v_user, p_user);
  perform public.urb_bump_social(v_user);
  perform public.urb_bump_social(p_user);
end;
$$;

create or replace function public.urb_block_user(p_user uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := public.urb_social_member();
  v_low uuid := least(v_user, p_user);
  v_high uuid := greatest(v_user, p_user);
begin
  if v_user = p_user or not exists (select 1 from public.urb_profiles where user_id = p_user) then
    raise exception 'urb_not_found' using errcode = 'P0002';
  end if;

  insert into public.urb_friendships (user_low, user_high, state, actor_id)
    values (v_low, v_high, 'blocked', v_user)
    on conflict (user_low, user_high) do update
      set state = 'blocked', actor_id = v_user, updated_at = now()
      where public.urb_friendships.state <> 'blocked' or public.urb_friendships.actor_id <> v_user;

  perform public.urb_delete_conversation(v_user, p_user);
  perform public.urb_close_offers_between(v_user, p_user);
  perform public.urb_bump_social(v_user);
  perform public.urb_bump_social(p_user);
end;
$$;

-- Deleting cloud data closes the player's offers first, so the other side gets back what it held.
create or replace function public.urb_delete_my_saves()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_other uuid;
  v_offer uuid;
begin
  if v_user is null then
    raise exception 'urb_unauthenticated' using errcode = '28000';
  end if;
  delete from public.urb_saves where user_id = v_user;

  for v_offer in select id from public.urb_trade_offers where v_user in (sender_id, recipient_id) and state in ('open', 'accepted') loop
    perform public.urb_close_offer(v_offer);
  end loop;
  for v_other in
    select case when f.user_low = v_user then f.user_high else f.user_low end
    from public.urb_friendships f where v_user in (f.user_low, f.user_high)
  loop
    perform public.urb_bump_social(v_other);
  end loop;
  delete from public.urb_profiles where user_id = v_user;
  delete from public.urb_search_attempts where user_id = v_user;
end;
$$;

revoke execute on function public.urb_lot_is_valid(jsonb) from public, anon, authenticated;
revoke execute on function public.urb_settle_offer(uuid) from public, anon, authenticated;
revoke execute on function public.urb_close_offer(uuid) from public, anon, authenticated;
revoke execute on function public.urb_close_offers_between(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.urb_expire_offers() from public, anon, authenticated;
revoke execute on function public.urb_offers_json(uuid) from public, anon, authenticated;
revoke execute on function public.urb_create_trade_offer(uuid, uuid, jsonb, integer) from public, anon;
revoke execute on function public.urb_accept_trade_offer(uuid) from public, anon;
revoke execute on function public.urb_decline_trade_offer(uuid) from public, anon;
revoke execute on function public.urb_claim_trade(uuid, text) from public, anon;
grant execute on function public.urb_create_trade_offer(uuid, uuid, jsonb, integer) to authenticated;
grant execute on function public.urb_accept_trade_offer(uuid) to authenticated;
grant execute on function public.urb_decline_trade_offer(uuid) to authenticated;
grant execute on function public.urb_claim_trade(uuid, text) to authenticated;

select cron.schedule('urb_expire_offers', '*/5 * * * *', 'select public.urb_expire_offers()');
