-- A player can abandon the Challenge they accepted. It is closed for good: it cannot be accepted again, the player waits for the next one.
alter table public.urb_challenge_acceptances drop constraint urb_challenge_acceptances_state_check;
alter table public.urb_challenge_acceptances add constraint urb_challenge_acceptances_state_check
  check (state in ('accepted', 'completed', 'expired', 'abandoned'));

create function public.urb_abandon_challenge(p_challenge uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := public.urb_social_member();
begin
  perform pg_advisory_xact_lock(hashtextextended(v_user::text, 5));
  perform public.urb_settle_acceptance(v_user, p_challenge);

  update public.urb_challenge_acceptances set state = 'abandoned'
    where user_id = v_user and challenge_id = p_challenge and state = 'accepted';
  if not found then
    raise exception 'urb_challenge_unavailable' using errcode = 'P0002';
  end if;
end;
$$;

revoke execute on function public.urb_abandon_challenge(uuid) from public, anon;

-- The listing tells which Challenges the player abandoned, so the client does not offer them again.
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
    'abandoned', coalesce((
      select jsonb_agg(a.challenge_id)
      from public.urb_challenge_acceptances a where a.user_id = v_user and a.state = 'abandoned'
    ), '[]'::jsonb),
    'medals', coalesce((
      select jsonb_agg(jsonb_build_object(
        'challengeId', m.challenge_id, 'medalCode', m.medal_code, 'nameFr', m.name_fr, 'nameEn', m.name_en, 'earnedAt', m.earned_at) order by m.earned_at)
      from public.urb_medals m where m.user_id = v_user
    ), '[]'::jsonb)
  );
end;
$$;

revoke execute on function public.urb_list_challenges() from public, anon;
