-- Makes trade calls safe to replay after a crash or a lost answer (ADR 0028):
-- accepting again an accepted offer is a no-op, and a slot already claimed stays listed to its owner
-- so that a client whose ledger lacks the matching effect can claim again and credit it once.

create or replace function public.urb_accept_trade_offer(p_id uuid)
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
    set state = 'accepted', accepted_at = now(), claim_deadline = now() + interval '72 hours', updated_at = now()
    where id = p_id;
  perform public.urb_bump_social(v_user);
  if v_offer.sender_id is not null then perform public.urb_bump_social(v_offer.sender_id); end if;
end;
$$;

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
