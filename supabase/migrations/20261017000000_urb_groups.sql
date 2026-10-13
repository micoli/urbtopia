-- Groups: named rooms whose members are all Friends of the creator (ADR 0030).
-- Written only through urb_* functions. Every object created here is prefixed `urb_`.

alter table public.urb_profiles add column groups_revision bigint not null default 1;

create table public.urb_groups (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.urb_profiles (user_id) on delete cascade,
  name text not null check (char_length(name) between 3 and 30),
  created_at timestamptz not null default now()
);

create index urb_groups_creator_idx on public.urb_groups (creator_id);

-- The creator is a member too. Unread Group messages are counted from a read cursor per member.
create table public.urb_group_members (
  group_id uuid not null references public.urb_groups (id) on delete cascade,
  user_id uuid not null references public.urb_profiles (user_id) on delete cascade,
  joined_at timestamptz not null default now(),
  last_read_message_id bigint not null default 0,
  constraint urb_group_members_pkey primary key (group_id, user_id)
);

create index urb_group_members_user_idx on public.urb_group_members (user_id);

create table public.urb_group_messages (
  id bigint generated always as identity primary key,
  group_id uuid not null references public.urb_groups (id) on delete cascade,
  sender_id uuid not null references public.urb_profiles (user_id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);

create index urb_group_messages_group_idx on public.urb_group_messages (group_id, id);
create index urb_group_messages_sender_idx on public.urb_group_messages (sender_id, created_at);
create index urb_group_messages_created_idx on public.urb_group_messages (created_at);

alter table public.urb_groups enable row level security;
alter table public.urb_group_members enable row level security;
alter table public.urb_group_messages enable row level security;
revoke all on public.urb_groups, public.urb_group_members, public.urb_group_messages from public, anon, authenticated;

create function public.urb_bump_groups(p_user uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.urb_profiles set groups_revision = groups_revision + 1 where user_id = p_user;
$$;

create function public.urb_bump_group_members(p_group uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.urb_profiles set groups_revision = groups_revision + 1
    where user_id in (select m.user_id from public.urb_group_members m where m.group_id = p_group);
$$;

-- p_blocker blocked p_blocked (the other direction does not count).
create function public.urb_has_blocked(p_blocker uuid, p_blocked uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.urb_friendships f
    where f.user_low = least(p_blocker, p_blocked) and f.user_high = greatest(p_blocker, p_blocked)
      and f.state = 'blocked' and f.actor_id = p_blocker
  );
$$;

-- Not being a member looks the same as the Group not existing.
create function public.urb_group_member(p_group uuid, p_user uuid)
returns void
language plpgsql
security definer
set search_path = ''
stable
as $$
begin
  if not exists (select 1 from public.urb_group_members m where m.group_id = p_group and m.user_id = p_user) then
    raise exception 'urb_not_found' using errcode = 'P0002';
  end if;
end;
$$;

create function public.urb_group_creator(p_group uuid, p_user uuid)
returns void
language plpgsql
security definer
set search_path = ''
stable
as $$
begin
  perform public.urb_group_member(p_group, p_user);
  if not exists (select 1 from public.urb_groups g where g.id = p_group and g.creator_id = p_user) then
    raise exception 'urb_not_creator' using errcode = 'P0001';
  end if;
end;
$$;

create function public.urb_group_name(p_name text)
returns text
language plpgsql
security definer
set search_path = ''
stable
as $$
declare
  v_name text := btrim(coalesce(p_name, ''));
begin
  if char_length(v_name) not between 3 and 30 then
    raise exception 'urb_group_name_invalid' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.urb_forbidden_handle_words w where position(w.word in lower(v_name)) > 0) then
    raise exception 'urb_group_name_forbidden' using errcode = 'P0001';
  end if;
  return v_name;
end;
$$;

-- Adds Friends of the creator to a Group; already-members are skipped. Caps: 10 members, 10 joined Groups per player.
create function public.urb_group_add(p_group uuid, p_creator uuid, p_members uuid[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_member uuid;
begin
  for v_member in select distinct u from unnest(coalesce(p_members, array[]::uuid[])) u where u <> p_creator loop
    if exists (select 1 from public.urb_group_members m where m.group_id = p_group and m.user_id = v_member) then
      continue;
    end if;
    if not public.urb_are_friends(p_creator, v_member) then
      raise exception 'urb_not_friends' using errcode = 'P0001';
    end if;
    if (select count(*) from public.urb_group_members m where m.group_id = p_group) >= 10 then
      raise exception 'urb_group_full' using errcode = 'P0001';
    end if;
    if (select count(*) from public.urb_group_members m join public.urb_groups g on g.id = m.group_id
        where m.user_id = v_member and g.creator_id <> v_member) >= 10 then
      raise exception 'urb_cap_groups_joined' using errcode = 'P0001';
    end if;
    insert into public.urb_group_members (group_id, user_id) values (p_group, v_member);
    perform public.urb_bump_groups(v_member);
  end loop;
end;
$$;

create function public.urb_create_group(p_name text, p_members uuid[])
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := public.urb_social_member();
  v_name text := public.urb_group_name(p_name);
  v_id uuid;
begin
  perform pg_advisory_xact_lock(hashtextextended(v_user::text, 6));
  if (select count(*) from public.urb_groups g where g.creator_id = v_user) >= 5 then
    raise exception 'urb_cap_groups_created' using errcode = 'P0001';
  end if;
  insert into public.urb_groups (creator_id, name) values (v_user, v_name) returning id into v_id;
  insert into public.urb_group_members (group_id, user_id) values (v_id, v_user);
  perform public.urb_group_add(v_id, v_user, p_members);
  perform public.urb_bump_group_members(v_id);
  return v_id;
end;
$$;

create function public.urb_rename_group(p_group uuid, p_name text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := public.urb_social_member();
  v_name text := public.urb_group_name(p_name);
begin
  perform public.urb_group_creator(p_group, v_user);
  update public.urb_groups set name = v_name where id = p_group and name <> v_name;
  if found then
    perform public.urb_bump_group_members(p_group);
  end if;
end;
$$;

create function public.urb_add_group_members(p_group uuid, p_members uuid[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := public.urb_social_member();
begin
  perform pg_advisory_xact_lock(hashtextextended(v_user::text, 6));
  perform public.urb_group_creator(p_group, v_user);
  perform public.urb_group_add(p_group, v_user, p_members);
  perform public.urb_bump_group_members(p_group);
end;
$$;

create function public.urb_remove_group_member(p_group uuid, p_user uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := public.urb_social_member();
begin
  perform public.urb_group_creator(p_group, v_user);
  if p_user = v_user or not exists (select 1 from public.urb_group_members m where m.group_id = p_group and m.user_id = p_user) then
    raise exception 'urb_not_found' using errcode = 'P0002';
  end if;
  delete from public.urb_group_members where group_id = p_group and user_id = p_user;
  perform public.urb_bump_groups(p_user);
  perform public.urb_bump_group_members(p_group);
end;
$$;

create function public.urb_leave_group(p_group uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := public.urb_social_member();
begin
  perform public.urb_group_member(p_group, v_user);
  if exists (select 1 from public.urb_groups g where g.id = p_group and g.creator_id = v_user) then
    raise exception 'urb_group_creator_cannot_leave' using errcode = 'P0001';
  end if;
  delete from public.urb_group_members where group_id = p_group and user_id = v_user;
  perform public.urb_bump_groups(v_user);
  perform public.urb_bump_group_members(p_group);
end;
$$;

create function public.urb_delete_group(p_group uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := public.urb_social_member();
begin
  perform public.urb_group_creator(p_group, v_user);
  perform public.urb_bump_group_members(p_group);
  delete from public.urb_groups where id = p_group;
end;
$$;

-- The 30 per minute and 500 per day caps count Messages and Group messages together.
create function public.urb_check_send_caps(p_user uuid)
returns void
language plpgsql
security definer
set search_path = ''
stable
as $$
declare
  v_recent integer;
  v_wait numeric;
begin
  select count(*), extract(epoch from min(s.at) + interval '1 minute' - now())
    into v_recent, v_wait
    from (
      select created_at as at from public.urb_messages where sender_id = p_user and created_at > now() - interval '1 minute'
      union all
      select created_at from public.urb_group_messages where sender_id = p_user and created_at > now() - interval '1 minute'
    ) s;
  if v_recent >= 30 then
    raise exception 'urb_rate_limited' using errcode = 'P0001', detail = greatest(1, ceil(v_wait))::text;
  end if;

  select count(*), extract(epoch from min(s.at) + interval '1 day' - now())
    into v_recent, v_wait
    from (
      select created_at as at from public.urb_messages where sender_id = p_user and created_at > now() - interval '1 day'
      union all
      select created_at from public.urb_group_messages where sender_id = p_user and created_at > now() - interval '1 day'
    ) s;
  if v_recent >= 500 then
    raise exception 'urb_rate_limited' using errcode = 'P0001', detail = greatest(1, ceil(v_wait))::text;
  end if;
end;
$$;

create or replace function public.urb_send_message(p_to uuid, p_body text)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := public.urb_social_member();
  v_body text := btrim(coalesce(p_body, ''));
  v_id bigint;
begin
  if char_length(v_body) not between 1 and 500 then
    raise exception 'urb_message_invalid' using errcode = 'P0001';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_user::text, 3));

  if not public.urb_are_friends(v_user, p_to) then
    raise exception 'urb_not_friends' using errcode = 'P0001';
  end if;

  perform public.urb_check_send_caps(v_user);

  insert into public.urb_messages (sender_id, recipient_id, body) values (v_user, p_to, v_body)
    returning id into v_id;
  perform public.urb_bump_social(v_user);
  perform public.urb_bump_social(p_to);
  return v_id;
end;
$$;

create function public.urb_send_group_message(p_group uuid, p_body text)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := public.urb_social_member();
  v_body text := btrim(coalesce(p_body, ''));
  v_id bigint;
begin
  if char_length(v_body) not between 1 and 500 then
    raise exception 'urb_message_invalid' using errcode = 'P0001';
  end if;
  perform public.urb_group_member(p_group, v_user);

  perform pg_advisory_xact_lock(hashtextextended(v_user::text, 3));
  perform public.urb_check_send_caps(v_user);

  insert into public.urb_group_messages (group_id, sender_id, body) values (p_group, v_user, v_body)
    returning id into v_id;
  perform public.urb_bump_group_members(p_group);
  return v_id;
end;
$$;

-- Group messages after p_after, oldest first, without those of authors the caller has blocked.
-- Reading moves the caller's read cursor to the last message of the Group.
create function public.urb_list_group_messages(p_group uuid, p_after bigint default 0)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := public.urb_social_member();
  v_last bigint;
  v_marked integer;
  v_result jsonb;
begin
  perform public.urb_group_member(p_group, v_user);

  select coalesce(max(m.id), 0) into v_last from public.urb_group_messages m where m.group_id = p_group;
  update public.urb_group_members set last_read_message_id = v_last
    where group_id = p_group and user_id = v_user and last_read_message_id < v_last;
  get diagnostics v_marked = row_count;
  if v_marked > 0 then
    perform public.urb_bump_groups(v_user);
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
      'id', m.id, 'fromMe', m.sender_id = v_user, 'senderId', m.sender_id, 'senderHandle', p.handle, 'senderAvatar', p.avatar,
      'body', m.body, 'at', m.created_at) order by m.id), '[]'::jsonb)
    into v_result
    from (
      select * from public.urb_group_messages gm
      where gm.group_id = p_group and gm.id > coalesce(p_after, 0) and not public.urb_has_blocked(v_user, gm.sender_id)
      order by gm.id desc
      limit 100
    ) m
    join public.urb_profiles p on p.user_id = m.sender_id;
  return v_result;
end;
$$;

-- The caller's Groups, most recently active first. Nothing but the revision when it matches p_cursor.
create function public.urb_list_groups(p_cursor bigint default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
stable
as $$
declare
  v_user uuid := public.urb_social_member();
  v_revision bigint;
begin
  select p.groups_revision into v_revision from public.urb_profiles p where p.user_id = v_user;

  if p_cursor is not null and p_cursor = v_revision then
    return jsonb_build_object('revision', v_revision, 'changed', false);
  end if;

  return jsonb_build_object(
    'revision', v_revision,
    'changed', true,
    'groups', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', g.id,
        'name', g.name,
        'creatorId', g.creator_id,
        'members', (
          select jsonb_agg(jsonb_build_object('userId', p.user_id, 'handle', p.handle, 'avatar', p.avatar) order by lower(p.handle))
          from public.urb_group_members gm join public.urb_profiles p on p.user_id = gm.user_id
          where gm.group_id = g.id
        ),
        'unread', (
          select count(*) from public.urb_group_messages m
          where m.group_id = g.id and m.id > me.last_read_message_id and m.sender_id <> v_user and not public.urb_has_blocked(v_user, m.sender_id)
        ),
        'lastMessageAt', last.created_at,
        'lastMessageFrom', last.handle,
        'lastMessagePreview', left(last.body, 80)
      ) order by coalesce(last.created_at, g.created_at) desc)
      from public.urb_group_members me
      join public.urb_groups g on g.id = me.group_id
      left join lateral (
        select m.created_at, m.body, sp.handle
        from public.urb_group_messages m join public.urb_profiles sp on sp.user_id = m.sender_id
        where m.group_id = g.id and not public.urb_has_blocked(v_user, m.sender_id)
        order by m.id desc limit 1
      ) last on true
      where me.user_id = v_user
    ), '[]'::jsonb)
  );
end;
$$;

-- A member who stops being a Friend of the creator leaves the Group (ADR 0030): removal or Block, in either direction.
create function public.urb_prune_groups_after_unfriend()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_groups uuid[];
  v_removed uuid[];
begin
  if old.state <> 'accepted' or (tg_op = 'UPDATE' and new.state = 'accepted') then
    return null;
  end if;

  with gone as (
    delete from public.urb_group_members m using public.urb_groups g
      where m.group_id = g.id and m.user_id <> g.creator_id
        and ((g.creator_id = old.user_low and m.user_id = old.user_high) or (g.creator_id = old.user_high and m.user_id = old.user_low))
      returning m.group_id, m.user_id
  )
  select array_agg(distinct group_id), array_agg(user_id) into v_groups, v_removed from gone;

  if v_groups is not null then
    update public.urb_profiles set groups_revision = groups_revision + 1
      where user_id = any (v_removed)
         or user_id in (select m.user_id from public.urb_group_members m where m.group_id = any (v_groups));
  end if;
  return null;
end;
$$;

create trigger urb_friendships_prune_groups
  after update or delete on public.urb_friendships
  for each row execute function public.urb_prune_groups_after_unfriend();

create or replace function public.urb_purge_old_messages()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.urb_messages where created_at < now() - interval '30 days';
  delete from public.urb_group_messages where created_at < now() - interval '30 days';
$$;

-- Deleting cloud data also ends the Groups the player created (cascade) and tells the other members.
create or replace function public.urb_delete_my_saves()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_other uuid;
  v_offer uuid;
begin
  if v_user is null then
    raise exception 'urb_unauthenticated' using errcode = '28000';
  end if;
  delete from public.urb_saves where user_id = v_user;

  for v_offer in select id from public.urb_trade_offers where v_user in (sender_id, recipient_id) and state in ('open', 'accepted') loop
    perform public.urb_close_offer(v_offer);
  end loop;
  for v_other in
    select case when f.user_low = v_user then f.user_high else f.user_low end
    from public.urb_friendships f where v_user in (f.user_low, f.user_high)
  loop
    perform public.urb_bump_social(v_other);
  end loop;
  update public.urb_profiles set groups_revision = groups_revision + 1
    where user_id in (
      select other.user_id from public.urb_group_members mine
      join public.urb_group_members other on other.group_id = mine.group_id and other.user_id <> v_user
      where mine.user_id = v_user
    );
  delete from public.urb_profiles where user_id = v_user;
  delete from public.urb_search_attempts where user_id = v_user;
end;
$$;

revoke execute on function public.urb_bump_groups(uuid) from public, anon, authenticated;
revoke execute on function public.urb_bump_group_members(uuid) from public, anon, authenticated;
revoke execute on function public.urb_has_blocked(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.urb_group_member(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.urb_group_creator(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.urb_group_name(text) from public, anon, authenticated;
revoke execute on function public.urb_group_add(uuid, uuid, uuid[]) from public, anon, authenticated;
revoke execute on function public.urb_check_send_caps(uuid) from public, anon, authenticated;
revoke execute on function public.urb_prune_groups_after_unfriend() from public, anon, authenticated;

revoke execute on function public.urb_create_group(text, uuid[]) from public, anon;
revoke execute on function public.urb_rename_group(uuid, text) from public, anon;
revoke execute on function public.urb_add_group_members(uuid, uuid[]) from public, anon;
revoke execute on function public.urb_remove_group_member(uuid, uuid) from public, anon;
revoke execute on function public.urb_leave_group(uuid) from public, anon;
revoke execute on function public.urb_delete_group(uuid) from public, anon;
revoke execute on function public.urb_send_group_message(uuid, text) from public, anon;
revoke execute on function public.urb_list_group_messages(uuid, bigint) from public, anon;
revoke execute on function public.urb_list_groups(bigint) from public, anon;

grant execute on function public.urb_create_group(text, uuid[]) to authenticated;
grant execute on function public.urb_rename_group(uuid, text) to authenticated;
grant execute on function public.urb_add_group_members(uuid, uuid[]) to authenticated;
grant execute on function public.urb_remove_group_member(uuid, uuid) to authenticated;
grant execute on function public.urb_leave_group(uuid) to authenticated;
grant execute on function public.urb_delete_group(uuid) to authenticated;
grant execute on function public.urb_send_group_message(uuid, text) to authenticated;
grant execute on function public.urb_list_group_messages(uuid, bigint) to authenticated;
grant execute on function public.urb_list_groups(bigint) to authenticated;
