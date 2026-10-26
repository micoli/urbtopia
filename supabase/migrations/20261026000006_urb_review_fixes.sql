-- An abandoned Challenge is closed for good: it can no longer be declared complete, like an expired one.
create or replace function public.urb_declare_challenge(p_challenge uuid, p_city uuid)
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
  if not found or v_acceptance.state not in ('accepted', 'completed') then
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

-- Deleting a City also takes down its Showcase and its Hall of fame opt-out.
create or replace function public.urb_delete_city_saves(p_city_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'urb_unauthenticated' using errcode = '28000';
  end if;
  if exists (
    select 1 from public.urb_shipments
    where user_id = auth.uid() and state = 'waiting' and p_city_id in (from_city_id, to_city_id)
  ) then
    raise exception 'urb_city_has_shipments' using errcode = 'P0001';
  end if;
  delete from public.urb_saves where user_id = auth.uid() and city_id = p_city_id;
  delete from public.urb_showcase where user_id = auth.uid() and city_id = p_city_id;
  delete from public.urb_hall_of_fame_opt_outs where user_id = auth.uid() and city_id = p_city_id;
end;
$$;
