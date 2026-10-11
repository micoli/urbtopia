-- Every object created here is prefixed `urb_`.

-- Adds a daily cap of 500 Messages per sender to the cap of 30 per minute.
create or replace function public.urb_send_message(p_to uuid, p_body text)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := public.urb_social_member();
  v_body text := btrim(coalesce(p_body, ''));
  v_recent integer;
  v_wait numeric;
  v_id bigint;
begin
  if char_length(v_body) not between 1 and 500 then
    raise exception 'urb_message_invalid' using errcode = 'P0001';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_user::text, 3));

  if not public.urb_are_friends(v_user, p_to) then
    raise exception 'urb_not_friends' using errcode = 'P0001';
  end if;

  select count(*), extract(epoch from min(created_at) + interval '1 minute' - now())
    into v_recent, v_wait
    from public.urb_messages
    where sender_id = v_user and created_at > now() - interval '1 minute';
  if v_recent >= 30 then
    raise exception 'urb_rate_limited' using errcode = 'P0001', detail = greatest(1, ceil(v_wait))::text;
  end if;

  select count(*), extract(epoch from min(created_at) + interval '1 day' - now())
    into v_recent, v_wait
    from public.urb_messages
    where sender_id = v_user and created_at > now() - interval '1 day';
  if v_recent >= 500 then
    raise exception 'urb_rate_limited' using errcode = 'P0001', detail = greatest(1, ceil(v_wait))::text;
  end if;

  insert into public.urb_messages (sender_id, recipient_id, body) values (v_user, p_to, v_body)
    returning id into v_id;
  perform public.urb_bump_social(v_user);
  perform public.urb_bump_social(p_to);
  return v_id;
end;
$$;
