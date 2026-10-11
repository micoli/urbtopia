-- Multiplayer: Avatar, a character picture chosen from a closed set and shown next to the Handle.
-- A null Avatar means the player never chose one; the client then derives a default.

alter table public.urb_profiles add column avatar text;
alter table public.urb_profiles add constraint urb_profiles_avatar_known check (
  avatar is null or avatar in ('character-female-a', 'character-female-b', 'character-female-c', 'character-female-d', 'character-female-e', 'character-female-f', 'character-male-a', 'character-male-b', 'character-male-c', 'character-male-d', 'character-male-e', 'character-male-f')
);

create function public.urb_set_avatar(p_avatar text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := public.urb_social_member();
  v_peer uuid;
begin
  if p_avatar is not null and p_avatar not in ('character-female-a', 'character-female-b', 'character-female-c', 'character-female-d', 'character-female-e', 'character-female-f', 'character-male-a', 'character-male-b', 'character-male-c', 'character-male-d', 'character-male-e', 'character-male-f') then
    raise exception 'urb_avatar_invalid' using errcode = 'P0001';
  end if;

  update public.urb_profiles set avatar = p_avatar where user_id = v_user and avatar is distinct from p_avatar;
  if not found then
    return;
  end if;

  perform public.urb_bump_social(v_user);
  for v_peer in
    select case when f.user_low = v_user then f.user_high else f.user_low end
    from public.urb_friendships f
    where f.state in ('accepted', 'pending') and v_user in (f.user_low, f.user_high)
  loop
    perform public.urb_bump_social(v_peer);
  end loop;
end;
$$;

revoke execute on function public.urb_set_avatar(text) from public, anon;
grant execute on function public.urb_set_avatar(text) to authenticated;

-- Offers, and the social state, now carry the Avatar of each Handle.
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
    'peerAvatar', peer.avatar,
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
    'avatar', v_me.avatar,
    'findable', v_me.findable,
    'handleChangedAt', v_me.handle_changed_at,
    'friends', coalesce((
      select jsonb_agg(jsonb_build_object(
        'userId', o.user_id, 'handle', o.handle, 'avatar', o.avatar, 'since', f.updated_at,
        'unread', (select count(*) from public.urb_messages m where m.recipient_id = v_user and m.sender_id = o.user_id and m.read_at is null),
        'lastMessageAt', (select max(m.created_at) from public.urb_messages m
                          where (m.sender_id = v_user and m.recipient_id = o.user_id) or (m.sender_id = o.user_id and m.recipient_id = v_user))
      ) order by lower(o.handle))
      from public.urb_friendships f
      join public.urb_profiles o on o.user_id = case when f.user_low = v_user then f.user_high else f.user_low end
      where f.state = 'accepted' and v_user in (f.user_low, f.user_high)
    ), '[]'::jsonb),
    'incoming', coalesce((
      select jsonb_agg(jsonb_build_object('userId', o.user_id, 'handle', o.handle, 'avatar', o.avatar, 'at', f.created_at) order by f.created_at)
      from public.urb_friendships f
      join public.urb_profiles o on o.user_id = f.actor_id
      where f.state = 'pending' and f.actor_id <> v_user and v_user in (f.user_low, f.user_high)
    ), '[]'::jsonb),
    'outgoing', coalesce((
      select jsonb_agg(jsonb_build_object(
        'userId', o.user_id, 'handle', o.handle, 'avatar', o.avatar, 'at', f.created_at) order by f.created_at)
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
