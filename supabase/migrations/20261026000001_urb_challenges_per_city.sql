-- Challenges per City: a Player account may accept a Challenge in each of its Cities (ADR 0047).
-- Acceptances made before Cities existed belong to the first City. Medals stay with the account.

alter table public.urb_challenge_acceptances add column city_id uuid not null default '00000000-0000-0000-0000-000000000001';
alter table public.urb_challenge_acceptances alter column city_id drop default;
alter table public.urb_challenge_acceptances drop constraint urb_challenge_acceptances_pkey;
alter table public.urb_challenge_acceptances add constraint urb_challenge_acceptances_pkey primary key (user_id, city_id, challenge_id);

-- A City has at most one accepted Challenge at a time.
drop index public.urb_challenge_acceptances_one_active;
create unique index urb_challenge_acceptances_one_active on public.urb_challenge_acceptances (user_id, city_id) where state = 'accepted';

drop function public.urb_list_challenges();
drop function public.urb_accept_challenge(uuid);
drop function public.urb_declare_challenge(uuid);
drop function public.urb_abandon_challenge(uuid);
drop function public.urb_settle_acceptance(uuid, uuid);

create function public.urb_settle_acceptance(p_user uuid, p_city uuid, p_challenge uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.urb_challenge_acceptances set state = 'expired'
    where user_id = p_user and city_id = p_city and challenge_id = p_challenge and state = 'accepted' and deadline <= now();
$$;

create function public.urb_list_challenges(p_city uuid)
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
  select a.challenge_id into v_accepted from public.urb_challenge_acceptances a
    where a.user_id = v_user and a.city_id = p_city and a.state = 'accepted';
  return jsonb_build_object(
    'now', now(),
    'challenges', coalesce((
      select jsonb_agg(public.urb_challenge_json(c) order by c.kind, c.starts_at, c.min_citizens, c.difficulty)
      from public.urb_challenges c
      where ((c.starts_at <= now() and c.ends_at > now()) or c.id = v_accepted)
        and not exists (
          select 1 from public.urb_challenge_acceptances a
          where a.user_id = v_user and a.city_id = p_city and a.challenge_id = c.id and a.state = 'completed'
        )
    ), '[]'::jsonb),
    'accepted', (
      select jsonb_build_object('challengeId', a.challenge_id, 'acceptedAt', a.accepted_at, 'deadline', a.deadline)
      from public.urb_challenge_acceptances a where a.user_id = v_user and a.city_id = p_city and a.state = 'accepted'
    ),
    'abandoned', coalesce((
      select jsonb_agg(a.challenge_id)
      from public.urb_challenge_acceptances a where a.user_id = v_user and a.city_id = p_city and a.state = 'abandoned'
    ), '[]'::jsonb),
    'medals', coalesce((
      select jsonb_agg(jsonb_build_object(
        'challengeId', m.challenge_id, 'medalCode', m.medal_code, 'nameFr', m.name_fr, 'nameEn', m.name_en, 'earnedAt', m.earned_at) order by m.earned_at)
      from public.urb_medals m where m.user_id = v_user
    ), '[]'::jsonb)
  );
end;
$$;

-- Accepts a Challenge for a City: stamped with the server clock, refused while that City has another one accepted. Idempotent.
create function public.urb_accept_challenge(p_challenge uuid, p_city uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := public.urb_social_member();
  v_challenge public.urb_challenges;
  v_acceptance public.urb_challenge_acceptances;
begin
  perform pg_advisory_xact_lock(hashtextextended(v_user::text, 5));
  perform public.urb_expire_challenges();

  select * into v_acceptance from public.urb_challenge_acceptances
    where user_id = v_user and city_id = p_city and challenge_id = p_challenge;
  if found then
    if v_acceptance.state <> 'accepted' then
      raise exception 'urb_challenge_unavailable' using errcode = 'P0002';
    end if;
    return jsonb_build_object('challengeId', p_challenge, 'acceptedAt', v_acceptance.accepted_at, 'deadline', v_acceptance.deadline);
  end if;

  select * into v_challenge from public.urb_challenges where id = p_challenge and starts_at <= now() and ends_at > now();
  if not found then
    raise exception 'urb_challenge_unavailable' using errcode = 'P0002';
  end if;
  if exists (select 1 from public.urb_challenge_acceptances where user_id = v_user and city_id = p_city and state = 'accepted') then
    raise exception 'urb_challenge_busy' using errcode = 'P0001';
  end if;

  insert into public.urb_challenge_acceptances (challenge_id, user_id, city_id, deadline)
    values (p_challenge, v_user, p_city, case when v_challenge.kind = 'daily' then now() + interval '24 hours' else v_challenge.ends_at end)
    returning * into v_acceptance;
  return jsonb_build_object('challengeId', p_challenge, 'acceptedAt', v_acceptance.accepted_at, 'deadline', v_acceptance.deadline);
end;
$$;

-- Declares a City's stock complete. Checks the deadline and the single claim per City only. Answers with what to apply locally,
-- again on a repeated declaration, so a client that lost the first answer can still credit it (its ledger credits it once).
-- A Medal is earned once per account, whatever the City that completes the Challenge.
create function public.urb_declare_challenge(p_challenge uuid, p_city uuid)
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
  perform public.urb_settle_acceptance(v_user, p_city, p_challenge);

  select * into v_acceptance from public.urb_challenge_acceptances
    where user_id = v_user and city_id = p_city and challenge_id = p_challenge for update;
  if not found or v_acceptance.state = 'expired' then
    raise exception 'urb_challenge_unavailable' using errcode = 'P0002';
  end if;
  select * into v_challenge from public.urb_challenges where id = p_challenge;

  v_already := v_acceptance.state = 'completed';
  if not v_already then
    update public.urb_challenge_acceptances set state = 'completed', completed_at = now()
      where user_id = v_user and city_id = p_city and challenge_id = p_challenge;
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

-- A City can abandon its accepted Challenge. It is closed for good for that City only.
create function public.urb_abandon_challenge(p_challenge uuid, p_city uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := public.urb_social_member();
begin
  perform pg_advisory_xact_lock(hashtextextended(v_user::text, 5));
  perform public.urb_settle_acceptance(v_user, p_city, p_challenge);

  update public.urb_challenge_acceptances set state = 'abandoned'
    where user_id = v_user and city_id = p_city and challenge_id = p_challenge and state = 'accepted';
  if not found then
    raise exception 'urb_challenge_unavailable' using errcode = 'P0002';
  end if;
end;
$$;

revoke execute on function public.urb_settle_acceptance(uuid, uuid, uuid) from public, anon, authenticated;
revoke execute on function public.urb_list_challenges(uuid) from public, anon;
revoke execute on function public.urb_accept_challenge(uuid, uuid) from public, anon;
revoke execute on function public.urb_declare_challenge(uuid, uuid) from public, anon;
revoke execute on function public.urb_abandon_challenge(uuid, uuid) from public, anon;
grant execute on function public.urb_list_challenges(uuid) to authenticated;
grant execute on function public.urb_accept_challenge(uuid, uuid) to authenticated;
grant execute on function public.urb_declare_challenge(uuid, uuid) to authenticated;
grant execute on function public.urb_abandon_challenge(uuid, uuid) to authenticated;
