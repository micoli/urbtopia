-- Multiplayer, delivery 1: Handle, email search and Friends.
-- Written only through urb_* functions. Every object created here is prefixed `urb_`.

create table public.urb_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  handle text not null,
  findable boolean not null default true,
  handle_changed_at timestamptz not null default now(),
  social_revision bigint not null default 1,
  created_at timestamptz not null default now(),
  constraint urb_profiles_handle_format check (handle ~ '^[A-Za-z0-9_-]{3,20}$')
);

create unique index urb_profiles_handle_lower_key on public.urb_profiles (lower(handle));

-- One row per pair of users. `actor_id` is the requester while pending, the blocker while blocked.
create table public.urb_friendships (
  user_low uuid not null references public.urb_profiles (user_id) on delete cascade,
  user_high uuid not null references public.urb_profiles (user_id) on delete cascade,
  state text not null check (state in ('pending', 'accepted', 'blocked')),
  actor_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint urb_friendships_pkey primary key (user_low, user_high),
  constraint urb_friendships_ordered check (user_low < user_high),
  constraint urb_friendships_actor_in_pair check (actor_id in (user_low, user_high))
);

create index urb_friendships_user_high_idx on public.urb_friendships (user_high);

create table public.urb_search_attempts (
  user_id uuid not null references auth.users (id) on delete cascade,
  attempted_at timestamptz not null default now()
);

create index urb_search_attempts_user_idx on public.urb_search_attempts (user_id, attempted_at);

create table public.urb_forbidden_handle_words (
  word text primary key check (word = lower(word))
);

insert into public.urb_forbidden_handle_words (word) values
  ('admin'), ('moderator'), ('support'), ('urbtopia'), ('urbix'),
  ('fuck'), ('shit'), ('bitch'), ('nazi'), ('merde'), ('putain'), ('connard'), ('salope'), ('nigger');

alter table public.urb_profiles enable row level security;
alter table public.urb_friendships enable row level security;
alter table public.urb_search_attempts enable row level security;
alter table public.urb_forbidden_handle_words enable row level security;

revoke all on public.urb_profiles, public.urb_friendships, public.urb_search_attempts, public.urb_forbidden_handle_words
  from public, anon, authenticated;
grant select on public.urb_profiles to authenticated;

create policy urb_profiles_select_own on public.urb_profiles
  for select to authenticated
  using (user_id = (select auth.uid()));

-- Internal helpers: not callable by clients.

create function public.urb_social_member()
returns uuid
language plpgsql
security definer
set search_path = ''
stable
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'urb_unauthenticated' using errcode = '28000';
  end if;
  if not exists (select 1 from auth.users u where u.id = v_user and u.email is not null) then
    raise exception 'urb_email_required' using errcode = 'P0001';
  end if;
  if not exists (select 1 from public.urb_profiles p where p.user_id = v_user) then
    raise exception 'urb_handle_required' using errcode = 'P0001';
  end if;
  return v_user;
end;
$$;

create function public.urb_bump_social(p_user uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.urb_profiles set social_revision = social_revision + 1 where user_id = p_user;
$$;

create function public.urb_friend_count(p_user uuid)
returns integer
language sql
security definer
set search_path = ''
stable
as $$
  select count(*)::integer from public.urb_friendships f
  where f.state = 'accepted' and p_user in (f.user_low, f.user_high);
$$;

create function public.urb_outgoing_count(p_user uuid)
returns integer
language sql
security definer
set search_path = ''
stable
as $$
  select count(*)::integer from public.urb_friendships f
  where f.state = 'pending' and f.actor_id = p_user;
$$;

-- Creates or settles a request from p_from to p_to; silently does nothing when it is not allowed.
create function public.urb_open_request(p_from uuid, p_to uuid)
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

-- Client-facing functions.

create function public.urb_set_handle(p_handle text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_current public.urb_profiles;
  v_exists boolean;
  v_wait interval;
begin
  if v_user is null then
    raise exception 'urb_unauthenticated' using errcode = '28000';
  end if;
  if not exists (select 1 from auth.users u where u.id = v_user and u.email is not null) then
    raise exception 'urb_email_required' using errcode = 'P0001';
  end if;
  if p_handle is null or p_handle !~ '^[A-Za-z0-9_-]{3,20}$' then
    raise exception 'urb_handle_invalid' using errcode = 'P0001';
  end if;
  if exists (
    select 1 from public.urb_forbidden_handle_words w where position(w.word in lower(p_handle)) > 0
  ) then
    raise exception 'urb_handle_forbidden' using errcode = 'P0001';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_user::text, 1));

  select * into v_current from public.urb_profiles where user_id = v_user;
  v_exists := found;

  if v_exists then
    if v_current.handle = p_handle then
      return;
    end if;
    v_wait := v_current.handle_changed_at + interval '30 days' - now();
    if v_wait > interval '0' then
      raise exception 'urb_handle_change_too_soon' using errcode = 'P0001', detail = ceil(extract(epoch from v_wait))::text;
    end if;
  end if;

  begin
    if v_exists then
      update public.urb_profiles
        set handle = p_handle, handle_changed_at = now(), social_revision = social_revision + 1
        where user_id = v_user;
    else
      insert into public.urb_profiles (user_id, handle) values (v_user, p_handle);
    end if;
  exception when unique_violation then
    raise exception 'urb_handle_taken' using errcode = 'P0001';
  end;
end;
$$;

create function public.urb_set_findable(p_findable boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := public.urb_social_member();
begin
  update public.urb_profiles
    set findable = p_findable, social_revision = social_revision + 1
    where user_id = v_user;
end;
$$;

-- Always answers the same way: nothing reveals whether the email matches an account.
create function public.urb_send_friend_request_by_email(p_email text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := public.urb_social_member();
  v_target uuid;
  v_hour_count integer;
  v_day_count integer;
  v_wait numeric := 0;
begin
  perform pg_advisory_xact_lock(hashtextextended(v_user::text, 2));

  delete from public.urb_search_attempts
    where user_id = v_user and attempted_at < now() - interval '1 day';

  select count(*) filter (where attempted_at > now() - interval '1 hour'), count(*)
    into v_hour_count, v_day_count
    from public.urb_search_attempts where user_id = v_user;

  if v_hour_count >= 10 then
    select extract(epoch from min(attempted_at) + interval '1 hour' - now()) into v_wait
      from public.urb_search_attempts where user_id = v_user and attempted_at > now() - interval '1 hour';
  end if;
  if v_day_count >= 30 then
    select greatest(v_wait, extract(epoch from min(attempted_at) + interval '1 day' - now())) into v_wait
      from public.urb_search_attempts where user_id = v_user;
  end if;
  if v_wait > 0 then
    raise exception 'urb_rate_limited' using errcode = 'P0001', detail = ceil(v_wait)::text;
  end if;

  insert into public.urb_search_attempts (user_id) values (v_user);

  if public.urb_friend_count(v_user) >= 50 then
    raise exception 'urb_cap_friends' using errcode = 'P0001';
  end if;
  if public.urb_outgoing_count(v_user) >= 20 then
    raise exception 'urb_cap_outgoing' using errcode = 'P0001';
  end if;

  select u.id into v_target
    from auth.users u
    join public.urb_profiles p on p.user_id = u.id
    where lower(u.email) = lower(btrim(p_email))
      and u.email_confirmed_at is not null
      and p.findable
      and u.id <> v_user;

  if v_target is null then
    return;
  end if;

  perform public.urb_open_request(v_user, v_target);
end;
$$;

create function public.urb_accept_friend_request(p_user uuid)
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

-- Refuses an incoming request or cancels an outgoing one.
create function public.urb_refuse_friend_request(p_user uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := public.urb_social_member();
begin
  delete from public.urb_friendships
    where user_low = least(v_user, p_user) and user_high = greatest(v_user, p_user) and state = 'pending';
  if not found then
    return;
  end if;
  perform public.urb_bump_social(v_user);
  perform public.urb_bump_social(p_user);
end;
$$;

create function public.urb_remove_friend(p_user uuid)
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
  perform public.urb_bump_social(v_user);
  perform public.urb_bump_social(p_user);
end;
$$;

create function public.urb_block_user(p_user uuid)
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

  perform public.urb_bump_social(v_user);
  perform public.urb_bump_social(p_user);
end;
$$;

create function public.urb_unblock_user(p_user uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := public.urb_social_member();
begin
  delete from public.urb_friendships
    where user_low = least(v_user, p_user) and user_high = greatest(v_user, p_user)
      and state = 'blocked' and actor_id = v_user;
  if not found then
    return;
  end if;
  perform public.urb_bump_social(v_user);
  perform public.urb_bump_social(p_user);
end;
$$;

-- Returns {"revision": n, "changed": false} when p_cursor is already current,
-- else the whole social state. A blocked account sees nothing of the block.
create function public.urb_list_social(p_cursor bigint default null)
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
      select jsonb_agg(jsonb_build_object('userId', o.user_id, 'handle', o.handle, 'since', f.updated_at) order by lower(o.handle))
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

-- Deleting cloud data also deletes the Handle, friendships and requests.
create or replace function public.urb_delete_my_saves()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_other uuid;
begin
  if v_user is null then
    raise exception 'urb_unauthenticated' using errcode = '28000';
  end if;
  delete from public.urb_saves where user_id = v_user;

  for v_other in
    select case when f.user_low = v_user then f.user_high else f.user_low end
    from public.urb_friendships f where v_user in (f.user_low, f.user_high)
  loop
    perform public.urb_bump_social(v_other);
  end loop;
  delete from public.urb_profiles where user_id = v_user;
  delete from public.urb_search_attempts where user_id = v_user;
end;
$$;

revoke execute on function public.urb_social_member() from public, anon, authenticated;
revoke execute on function public.urb_bump_social(uuid) from public, anon, authenticated;
revoke execute on function public.urb_friend_count(uuid) from public, anon, authenticated;
revoke execute on function public.urb_outgoing_count(uuid) from public, anon, authenticated;
revoke execute on function public.urb_open_request(uuid, uuid) from public, anon, authenticated;

revoke execute on function public.urb_set_handle(text) from public, anon;
revoke execute on function public.urb_set_findable(boolean) from public, anon;
revoke execute on function public.urb_send_friend_request_by_email(text) from public, anon;
revoke execute on function public.urb_accept_friend_request(uuid) from public, anon;
revoke execute on function public.urb_refuse_friend_request(uuid) from public, anon;
revoke execute on function public.urb_remove_friend(uuid) from public, anon;
revoke execute on function public.urb_block_user(uuid) from public, anon;
revoke execute on function public.urb_unblock_user(uuid) from public, anon;
revoke execute on function public.urb_list_social(bigint) from public, anon;

grant execute on function public.urb_set_handle(text) to authenticated;
grant execute on function public.urb_set_findable(boolean) to authenticated;
grant execute on function public.urb_send_friend_request_by_email(text) to authenticated;
grant execute on function public.urb_accept_friend_request(uuid) to authenticated;
grant execute on function public.urb_refuse_friend_request(uuid) to authenticated;
grant execute on function public.urb_remove_friend(uuid) to authenticated;
grant execute on function public.urb_block_user(uuid) to authenticated;
grant execute on function public.urb_unblock_user(uuid) to authenticated;
grant execute on function public.urb_list_social(bigint) to authenticated;
