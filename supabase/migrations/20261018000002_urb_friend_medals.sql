-- A Medal keeps the translated name of the Event it was earned in, so every client can show it in its language.
alter table public.urb_medals add column name_fr text, add column name_en text;

-- A Friend's Medals travel with the social state, so the Friends tab can show them (at most the 20 latest of each Friend).
-- Earning a Medal bumps the revision of the player and of their Friends, so a poll with a cursor sees it.
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
                          where (m.sender_id = v_user and m.recipient_id = o.user_id) or (m.sender_id = o.user_id and m.recipient_id = v_user)),
        'medals', coalesce((
          select jsonb_agg(jsonb_build_object('medalCode', l.medal_code, 'nameFr', l.name_fr, 'nameEn', l.name_en, 'earnedAt', l.earned_at) order by l.earned_at)
          from (select m.medal_code, m.name_fr, m.name_en, m.earned_at from public.urb_medals m where m.user_id = o.user_id order by m.earned_at desc limit 20) l
        ), '[]'::jsonb)
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

revoke execute on function public.urb_list_social(bigint) from public, anon;

create function public.urb_bump_friends(p_user uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  select public.urb_bump_social(case when f.user_low = p_user then f.user_high else f.user_low end)
  from public.urb_friendships f where f.state = 'accepted' and p_user in (f.user_low, f.user_high);
$$;

revoke execute on function public.urb_bump_friends(uuid) from public, anon, authenticated;

create or replace function public.urb_declare_challenge(p_challenge uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := public.urb_social_member();
  v_challenge public.urb_challenges;
  v_acceptance public.urb_challenge_acceptances;
  v_already boolean;
begin
  perform pg_advisory_xact_lock(hashtextextended(v_user::text, 5));
  perform public.urb_settle_acceptance(v_user, p_challenge);

  select * into v_acceptance from public.urb_challenge_acceptances
    where user_id = v_user and challenge_id = p_challenge for update;
  if not found or v_acceptance.state = 'expired' then
    raise exception 'urb_challenge_unavailable' using errcode = 'P0002';
  end if;
  select * into v_challenge from public.urb_challenges where id = p_challenge;

  v_already := v_acceptance.state = 'completed';
  if not v_already then
    update public.urb_challenge_acceptances set state = 'completed', completed_at = now()
      where user_id = v_user and challenge_id = p_challenge;
    if v_challenge.reward_kind = 'medal' then
      insert into public.urb_medals (user_id, challenge_id, medal_code, name_fr, name_en)
        values (v_user, p_challenge, v_challenge.medal_code, v_challenge.name_fr, v_challenge.name_en)
        on conflict do nothing;
      perform public.urb_bump_social(v_user);
      perform public.urb_bump_friends(v_user);
    end if;
  end if;

  return jsonb_build_object(
    'challengeId', p_challenge,
    'rewardKind', v_challenge.reward_kind,
    'goal', v_challenge.goal,
    'medalCode', v_challenge.medal_code,
    'alreadyClaimed', v_already
  );
end;
$$;

revoke execute on function public.urb_declare_challenge(uuid) from public, anon;

-- The player's own Medals carry their names too.
create or replace function public.urb_list_challenges()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := public.urb_social_member();
  v_accepted uuid;
begin
  perform public.urb_expire_challenges();
  select a.challenge_id into v_accepted from public.urb_challenge_acceptances a where a.user_id = v_user and a.state = 'accepted';
  return jsonb_build_object(
    'now', now(),
    'challenges', coalesce((
      select jsonb_agg(public.urb_challenge_json(c) order by c.kind, c.starts_at, c.min_citizens, c.difficulty)
      from public.urb_challenges c where (c.starts_at <= now() and c.ends_at > now()) or c.id = v_accepted
    ), '[]'::jsonb),
    'accepted', (
      select jsonb_build_object('challengeId', a.challenge_id, 'acceptedAt', a.accepted_at, 'deadline', a.deadline)
      from public.urb_challenge_acceptances a where a.user_id = v_user and a.state = 'accepted'
    ),
    'medals', coalesce((
      select jsonb_agg(jsonb_build_object(
        'challengeId', m.challenge_id, 'medalCode', m.medal_code, 'nameFr', m.name_fr, 'nameEn', m.name_en, 'earnedAt', m.earned_at) order by m.earned_at)
      from public.urb_medals m where m.user_id = v_user
    ), '[]'::jsonb)
  );
end;
$$;

revoke execute on function public.urb_list_challenges() from public, anon;
