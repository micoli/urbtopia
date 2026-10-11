-- Every object created here is prefixed `urb_`.

-- A block never replaces the other side's block: otherwise the blocked account could take it over and lift it.
-- Blocking again changes nothing and bumps nobody.
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
  v_changed integer;
begin
  if v_user = p_user or not exists (select 1 from public.urb_profiles where user_id = p_user) then
    raise exception 'urb_not_found' using errcode = 'P0002';
  end if;

  insert into public.urb_friendships (user_low, user_high, state, actor_id)
    values (v_low, v_high, 'blocked', v_user)
    on conflict (user_low, user_high) do update
      set state = 'blocked', actor_id = v_user, updated_at = now()
      where public.urb_friendships.state <> 'blocked';
  get diagnostics v_changed = row_count;
  if v_changed = 0 then
    return;
  end if;

  perform public.urb_delete_conversation(v_user, p_user);
  perform public.urb_close_offers_between(v_user, p_user);
  perform public.urb_bump_social(v_user);
  perform public.urb_bump_social(p_user);
end;
$$;
