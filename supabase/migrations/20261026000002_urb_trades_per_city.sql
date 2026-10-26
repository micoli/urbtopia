-- Trade offers per City (ADR 0047): an offer leaves one City and lands in the City open at acceptance time.
-- What an offer gives back (the payment, a refused or expired Lot or price) is claimed by the City it left.
-- Offers made before Cities existed belong to the first City on both sides.

alter table public.urb_trade_offers add column sender_city_id uuid not null default '00000000-0000-0000-0000-000000000001';
alter table public.urb_trade_offers alter column sender_city_id drop default;
alter table public.urb_trade_offers add column recipient_city_id uuid;
update public.urb_trade_offers set recipient_city_id = '00000000-0000-0000-0000-000000000001' where accepted_at is not null;

drop function public.urb_create_trade_offer(uuid, uuid, jsonb, integer);
drop function public.urb_accept_trade_offer(uuid);
drop function public.urb_claim_trade(uuid, text);

create function public.urb_create_trade_offer(p_id uuid, p_to uuid, p_lot jsonb, p_price integer, p_city uuid)
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
  if p_id is null or p_city is null or not public.urb_lot_is_valid(p_lot) or p_price is null or p_price not between 0 and 10000 then
    raise exception 'urb_trade_invalid' using errcode = 'P0001';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_user::text, 4));

  select * into v_existing from public.urb_trade_offers where id = p_id;
  if found then
    if v_existing.sender_id is distinct from v_user or v_existing.recipient_id is distinct from p_to
       or v_existing.lot <> p_lot or v_existing.price <> p_price or v_existing.sender_city_id <> p_city then
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

  insert into public.urb_trade_offers (id, sender_id, recipient_id, lot, price, expires_at, sender_city_id)
    values (p_id, v_user, p_to, p_lot, p_price, now() + interval '72 hours', p_city);
  perform public.urb_bump_social(v_user);
  perform public.urb_bump_social(p_to);
  return p_id;
end;
$$;

-- Accepting an accepted offer again is a no-op and keeps the City that first accepted it (ADR 0028).
create function public.urb_accept_trade_offer(p_id uuid, p_city uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := public.urb_social_member();
  v_offer public.urb_trade_offers;
begin
  if p_city is null then
    raise exception 'urb_trade_invalid' using errcode = 'P0001';
  end if;
  perform public.urb_settle_offer(p_id);
  select * into v_offer from public.urb_trade_offers where id = p_id for update;
  if not found or v_offer.recipient_id is distinct from v_user then
    raise exception 'urb_trade_unavailable' using errcode = 'P0002';
  end if;
  if v_offer.accepted_at is not null then
    return;
  end if;
  if v_offer.state <> 'open' then
    raise exception 'urb_trade_unavailable' using errcode = 'P0002';
  end if;
  update public.urb_trade_offers
    set state = 'accepted', accepted_at = now(), claim_deadline = now() + interval '72 hours', updated_at = now(), recipient_city_id = p_city
    where id = p_id;
  perform public.urb_bump_social(v_user);
  if v_offer.sender_id is not null then perform public.urb_bump_social(v_offer.sender_id); end if;
end;
$$;

-- Claims the Lot or the payment of an offer, for the City that owns that side. Answers with what to apply locally,
-- again on a repeated claim, so a client that lost the first answer can still credit it (its ledger credits it only once).
create function public.urb_claim_trade(p_id uuid, p_slot text, p_city uuid)
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

  if v_owner is null or v_owner <> v_user
     or p_city is distinct from (case when v_owner = v_offer.sender_id then v_offer.sender_city_id else v_offer.recipient_city_id end) then
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

-- The offers carry the City of the viewer's side, null while a recipient has not accepted yet.
create or replace function public.urb_offers_json(p_user uuid)
returns jsonb
language sql
security definer
set search_path = ''
stable
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', o.id,
    'role', case when o.sender_id = p_user then 'sender' else 'recipient' end,
    'cityId', case when o.sender_id = p_user then o.sender_city_id else o.recipient_city_id end,
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
    ),
    'claimed', (
      select coalesce(jsonb_agg(slot), '[]'::jsonb) from (
        select 'lot' as slot where o.lot_claimed_at is not null and (
          (o.state = 'accepted' and o.recipient_id = p_user)
          or (o.state in ('refused', 'cancelled', 'expired', 'lapsed') and o.sender_id = p_user))
        union all
        select 'payment' where o.payment_claimed_at is not null and (
          (o.state = 'accepted' and o.sender_id = p_user)
          or (o.state = 'lapsed' and o.recipient_id = p_user))
      ) s
    )
  ) order by o.updated_at desc), '[]'::jsonb)
  from (
    select * from public.urb_trade_offers
    where p_user in (sender_id, recipient_id)
    order by updated_at desc
    limit 100
  ) o
  join public.urb_profiles peer on peer.user_id = case when o.sender_id = p_user then o.recipient_id else o.sender_id end
  where o.state = 'open'
    or (o.state = 'accepted' and o.lot_claimed_at is null)
    or (o.sender_id = p_user and o.state in ('refused', 'cancelled', 'expired', 'lapsed', 'accepted'))
    or (o.recipient_id = p_user and o.state in ('accepted', 'lapsed'));
$$;

revoke execute on function public.urb_create_trade_offer(uuid, uuid, jsonb, integer, uuid) from public, anon;
revoke execute on function public.urb_accept_trade_offer(uuid, uuid) from public, anon;
revoke execute on function public.urb_claim_trade(uuid, text, uuid) from public, anon;
grant execute on function public.urb_create_trade_offer(uuid, uuid, jsonb, integer, uuid) to authenticated;
grant execute on function public.urb_accept_trade_offer(uuid, uuid) to authenticated;
grant execute on function public.urb_claim_trade(uuid, text, uuid) to authenticated;
