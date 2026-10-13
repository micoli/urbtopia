-- The Challenge a player has accepted stays listed after its publication window closes, so the client can always
-- recover its goal (a Daily challenge accepted late in the day is still running the next morning).
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
      select jsonb_agg(jsonb_build_object('challengeId', m.challenge_id, 'medalCode', m.medal_code, 'earnedAt', m.earned_at) order by m.earned_at)
      from public.urb_medals m where m.user_id = v_user
    ), '[]'::jsonb)
  );
end;
$$;

revoke execute on function public.urb_list_challenges() from public, anon;
