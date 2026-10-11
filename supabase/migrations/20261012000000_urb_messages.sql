-- Multiplayer, delivery 2: messages between Friends.
-- Written only through urb_* functions. Every object created here is prefixed `urb_`.

create table public.urb_messages (
  id bigint generated always as identity primary key,
  sender_id uuid not null references public.urb_profiles (user_id) on delete cascade,
  recipient_id uuid not null references public.urb_profiles (user_id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now(),
  read_at timestamptz,
  constraint urb_messages_not_self check (sender_id <> recipient_id)
);

create index urb_messages_recipient_idx on public.urb_messages (recipient_id, sender_id, id);
create index urb_messages_sender_idx on public.urb_messages (sender_id, created_at);
create index urb_messages_created_idx on public.urb_messages (created_at);

alter table public.urb_messages enable row level security;
revoke all on public.urb_messages from public, anon, authenticated;

create function public.urb_delete_conversation(p_a uuid, p_b uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.urb_messages
  where (sender_id = p_a and recipient_id = p_b) or (sender_id = p_b and recipient_id = p_a);
$$;

create function public.urb_are_friends(p_a uuid, p_b uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.urb_friendships f
    where f.user_low = least(p_a, p_b) and f.user_high = greatest(p_a, p_b) and f.state = 'accepted'
  );
$$;

create function public.urb_send_message(p_to uuid, p_body text)
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

  insert into public.urb_messages (sender_id, recipient_id, body) values (v_user, p_to, v_body)
    returning id into v_id;
  perform public.urb_bump_social(v_user);
  perform public.urb_bump_social(p_to);
  return v_id;
end;
$$;

-- The caller's Conversation with a Friend, oldest first, only Messages after p_after.
-- Reading marks the other side's Messages as read.
create function public.urb_list_messages(p_with uuid, p_after bigint default 0)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := public.urb_social_member();
  v_marked integer;
  v_result jsonb;
begin
  if not public.urb_are_friends(v_user, p_with) then
    raise exception 'urb_not_friends' using errcode = 'P0001';
  end if;

  update public.urb_messages set read_at = now()
    where recipient_id = v_user and sender_id = p_with and read_at is null;
  get diagnostics v_marked = row_count;
  if v_marked > 0 then
    perform public.urb_bump_social(v_user);
  end if;

  select coalesce(jsonb_agg(jsonb_build_object('id', m.id, 'fromMe', m.sender_id = v_user, 'body', m.body, 'at', m.created_at) order by m.id), '[]'::jsonb)
    into v_result
    from (
      select * from public.urb_messages
      where ((sender_id = v_user and recipient_id = p_with) or (sender_id = p_with and recipient_id = v_user))
        and id > coalesce(p_after, 0)
      order by id desc
      limit 100
    ) m;
  return v_result;
end;
$$;

-- Friends now carry their unread count and the time of the last Message.
create or replace function public.urb_list_social(p_cursor bigint default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
stable
as $$
declare
  v_user uuid := public.urb_social_member();
  v_me public.urb_profiles;
begin
  select * into v_me from public.urb_profiles where user_id = v_user;

  if p_cursor is not null and p_cursor = v_me.social_revision then
    return jsonb_build_object('revision', v_me.social_revision, 'changed', false);
  end if;

  return jsonb_build_object(
    'revision', v_me.social_revision,
    'changed', true,
    'handle', v_me.handle,
    'findable', v_me.findable,
    'handleChangedAt', v_me.handle_changed_at,
    'friends', coalesce((
      select jsonb_agg(jsonb_build_object(
        'userId', o.user_id, 'handle', o.handle, 'since', f.updated_at,
        'unread', (select count(*) from public.urb_messages m where m.recipient_id = v_user and m.sender_id = o.user_id and m.read_at is null),
        'lastMessageAt', (select max(m.created_at) from public.urb_messages m
                          where (m.sender_id = v_user and m.recipient_id = o.user_id) or (m.sender_id = o.user_id and m.recipient_id = v_user))
      ) order by lower(o.handle))
      from public.urb_friendships f
      join public.urb_profiles o on o.user_id = case when f.user_low = v_user then f.user_high else f.user_low end
      where f.state = 'accepted' and v_user in (f.user_low, f.user_high)
    ), '[]'::jsonb),
    'incoming', coalesce((
      select jsonb_agg(jsonb_build_object('userId', o.user_id, 'handle', o.handle, 'at', f.created_at) order by f.created_at)
      from public.urb_friendships f
      join public.urb_profiles o on o.user_id = f.actor_id
      where f.state = 'pending' and f.actor_id <> v_user and v_user in (f.user_low, f.user_high)
    ), '[]'::jsonb),
    'outgoing', coalesce((
      select jsonb_agg(jsonb_build_object(
        'userId', o.user_id, 'handle', o.handle, 'at', f.created_at) order by f.created_at)
      from public.urb_friendships f
      join public.urb_profiles o on o.user_id = case when f.user_low = v_user then f.user_high else f.user_low end
      where f.state = 'pending' and f.actor_id = v_user
    ), '[]'::jsonb),
    'blocked', coalesce((
      select jsonb_agg(jsonb_build_object('userId', o.user_id, 'handle', o.handle) order by lower(o.handle))
      from public.urb_friendships f
      join public.urb_profiles o on o.user_id = case when f.user_low = v_user then f.user_high else f.user_low end
      where f.state = 'blocked' and f.actor_id = v_user
    ), '[]'::jsonb)
  );
end;
$$;

-- The Conversation ends with the Friendship.
create or replace function public.urb_remove_friend(p_user uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := public.urb_social_member();
begin
  delete from public.urb_friendships
    where user_low = least(v_user, p_user) and user_high = greatest(v_user, p_user) and state = 'accepted';
  if not found then
    return;
  end if;
  perform public.urb_delete_conversation(v_user, p_user);
  perform public.urb_bump_social(v_user);
  perform public.urb_bump_social(p_user);
end;
$$;

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
begin
  if v_user = p_user or not exists (select 1 from public.urb_profiles where user_id = p_user) then
    raise exception 'urb_not_found' using errcode = 'P0002';
  end if;

  insert into public.urb_friendships (user_low, user_high, state, actor_id)
    values (v_low, v_high, 'blocked', v_user)
    on conflict (user_low, user_high) do update
      set state = 'blocked', actor_id = v_user, updated_at = now()
      where public.urb_friendships.state <> 'blocked' or public.urb_friendships.actor_id <> v_user;

  perform public.urb_delete_conversation(v_user, p_user);
  perform public.urb_bump_social(v_user);
  perform public.urb_bump_social(p_user);
end;
$$;

create function public.urb_purge_old_messages()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.urb_messages where created_at < now() - interval '30 days';
$$;

revoke execute on function public.urb_delete_conversation(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.urb_are_friends(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.urb_purge_old_messages() from public, anon, authenticated;
revoke execute on function public.urb_send_message(uuid, text) from public, anon;
revoke execute on function public.urb_list_messages(uuid, bigint) from public, anon;
grant execute on function public.urb_send_message(uuid, text) to authenticated;
grant execute on function public.urb_list_messages(uuid, bigint) to authenticated;

select cron.schedule('urb_purge_old_messages', '23 3 * * *', 'select public.urb_purge_old_messages()');
