-- Every object created here is prefixed `urb_`.

-- Takes the friend-count lock of both players, always in the same order, so the cap of 50 holds under concurrency.
create or replace function public.urb_lock_pair(p_a uuid, p_b uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  select pg_advisory_xact_lock(hashtextextended(least(p_a, p_b)::text, 5)),
         pg_advisory_xact_lock(hashtextextended(greatest(p_a, p_b)::text, 5));
$$;

create or replace function public.urb_open_request(p_from uuid, p_to uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_low uuid := least(p_from, p_to);
  v_high uuid := greatest(p_from, p_to);
  v_row public.urb_friendships;
begin
  if p_from = p_to then
    return;
  end if;

  perform public.urb_lock_pair(p_from, p_to);

  select * into v_row from public.urb_friendships where user_low = v_low and user_high = v_high;

  if found then
    if v_row.state = 'pending' and v_row.actor_id = p_to
       and public.urb_friend_count(p_from) < 50 and public.urb_friend_count(p_to) < 50 then
      update public.urb_friendships set state = 'accepted', actor_id = p_from, updated_at = now()
        where user_low = v_low and user_high = v_high;
      perform public.urb_bump_social(p_from);
      perform public.urb_bump_social(p_to);
    end if;
    return;
  end if;

  if public.urb_friend_count(p_to) >= 50 then
    return;
  end if;

  insert into public.urb_friendships (user_low, user_high, state, actor_id)
    values (v_low, v_high, 'pending', p_from);
  perform public.urb_bump_social(p_from);
  perform public.urb_bump_social(p_to);
end;
$$;

create or replace function public.urb_accept_friend_request(p_user uuid)
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
  perform public.urb_lock_pair(v_user, p_user);

  perform 1 from public.urb_friendships
    where user_low = v_low and user_high = v_high and state = 'pending' and actor_id = p_user;
  if not found then
    raise exception 'urb_not_found' using errcode = 'P0002';
  end if;
  if public.urb_friend_count(v_user) >= 50 or public.urb_friend_count(p_user) >= 50 then
    raise exception 'urb_cap_friends' using errcode = 'P0001';
  end if;

  update public.urb_friendships set state = 'accepted', updated_at = now()
    where user_low = v_low and user_high = v_high;
  perform public.urb_bump_social(v_user);
  perform public.urb_bump_social(p_user);
end;
$$;

revoke execute on function public.urb_lock_pair(uuid, uuid) from public, anon, authenticated;
