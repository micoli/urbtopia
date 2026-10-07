-- Cloud saves: a mirror of the local save, written only through urb_* functions.
-- Every object created here is prefixed `urb_`.

create extension if not exists pg_cron with schema pg_catalog;

create table public.urb_saves (
  user_id uuid not null references auth.users (id) on delete cascade,
  revision bigint not null check (revision > 0),
  format_version integer not null,
  envelope jsonb not null,
  client_saved_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint urb_saves_pkey primary key (user_id, revision)
);

alter table public.urb_saves enable row level security;

revoke all on public.urb_saves from public, anon, authenticated;
grant select on public.urb_saves to authenticated;

create policy urb_saves_select_own on public.urb_saves
  for select to authenticated
  using (user_id = (select auth.uid()));

create function public.urb_push_save(
  p_base_revision bigint,
  p_envelope jsonb,
  p_format_version integer,
  p_client_saved_at timestamptz,
  p_keep_previous boolean default false
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_current public.urb_saves;
  v_next bigint;
begin
  if v_user is null then
    raise exception 'urb_unauthenticated' using errcode = '28000';
  end if;
  if octet_length(p_envelope::text) > 1048576 then
    raise exception 'urb_too_large' using errcode = '54000';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_user::text, 0));

  select * into v_current from public.urb_saves where user_id = v_user order by revision desc limit 1;

  if coalesce(p_base_revision, 0) <> coalesce(v_current.revision, 0) then
    raise exception 'urb_conflict' using errcode = 'P0001', detail = coalesce(v_current.revision, 0)::text;
  end if;

  v_next := coalesce(v_current.revision, 0) + 1;

  if not p_keep_previous and v_current.revision is not null and v_current.created_at > now() - interval '1 hour' then
    update public.urb_saves
      set revision = v_next, envelope = p_envelope, format_version = p_format_version,
          client_saved_at = p_client_saved_at, updated_at = now()
      where user_id = v_user and revision = v_current.revision;
    return v_next;
  end if;

  insert into public.urb_saves (user_id, revision, format_version, envelope, client_saved_at)
    values (v_user, v_next, p_format_version, p_envelope, p_client_saved_at);

  delete from public.urb_saves
    where user_id = v_user
      and revision <= (select revision from public.urb_saves where user_id = v_user order by revision desc offset 4 limit 1);

  return v_next;
end;
$$;

create function public.urb_list_saves()
returns table (revision bigint, format_version integer, client_saved_at timestamptz, created_at timestamptz, updated_at timestamptz)
language sql
security definer
set search_path = ''
stable
as $$
  select s.revision, s.format_version, s.client_saved_at, s.created_at, s.updated_at
  from public.urb_saves s
  where s.user_id = auth.uid()
  order by s.revision desc;
$$;

create function public.urb_restore_save(p_revision bigint)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_source public.urb_saves;
  v_next bigint;
begin
  if v_user is null then
    raise exception 'urb_unauthenticated' using errcode = '28000';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_user::text, 0));

  select * into v_source from public.urb_saves where user_id = v_user and revision = p_revision;
  if not found then
    raise exception 'urb_not_found' using errcode = 'P0002';
  end if;

  select coalesce(max(revision), 0) + 1 into v_next from public.urb_saves where user_id = v_user;

  insert into public.urb_saves (user_id, revision, format_version, envelope, client_saved_at)
    values (v_user, v_next, v_source.format_version, v_source.envelope, v_source.client_saved_at);

  delete from public.urb_saves
    where user_id = v_user
      and revision <= (select revision from public.urb_saves where user_id = v_user order by revision desc offset 4 limit 1);

  return v_next;
end;
$$;

create function public.urb_delete_my_saves()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'urb_unauthenticated' using errcode = '28000';
  end if;
  delete from public.urb_saves where user_id = auth.uid();
end;
$$;

create function public.urb_purge_inactive_anonymous_users()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from auth.users u
  where u.is_anonymous
    and u.email is null
    and coalesce(u.last_sign_in_at, u.created_at) < now() - interval '90 days'
    and not exists (
      select 1 from public.urb_saves s
      where s.user_id = u.id and s.updated_at >= now() - interval '90 days'
    );
$$;

revoke execute on function public.urb_push_save(bigint, jsonb, integer, timestamptz, boolean) from public, anon;
revoke execute on function public.urb_list_saves() from public, anon;
revoke execute on function public.urb_restore_save(bigint) from public, anon;
revoke execute on function public.urb_delete_my_saves() from public, anon;
revoke execute on function public.urb_purge_inactive_anonymous_users() from public, anon, authenticated;

grant execute on function public.urb_push_save(bigint, jsonb, integer, timestamptz, boolean) to authenticated;
grant execute on function public.urb_list_saves() to authenticated;
grant execute on function public.urb_restore_save(bigint) to authenticated;
grant execute on function public.urb_delete_my_saves() to authenticated;

select cron.schedule(
  'urb_purge_inactive_anonymous_users',
  '17 3 * * *',
  'select public.urb_purge_inactive_anonymous_users()'
);
