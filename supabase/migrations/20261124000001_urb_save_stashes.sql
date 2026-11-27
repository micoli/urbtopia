-- Work set aside: the unpushed work of a device that lost the Active device lease is kept as a previous version
-- of its City, without becoming the current save (ADR 0095). Three are kept per City.
-- A stash appears in the version list with a negative revision, which urb_restore_save reads as a stash id.

create table public.urb_save_stashes (
  user_id uuid not null references auth.users (id) on delete cascade,
  city_id uuid not null,
  id bigint generated always as identity,
  format_version integer not null,
  envelope jsonb not null,
  client_saved_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint urb_save_stashes_pkey primary key (user_id, city_id, id)
);

alter table public.urb_save_stashes enable row level security;
revoke all on public.urb_save_stashes from public, anon, authenticated;

create function public.urb_stash_save(
  p_city_id uuid,
  p_envelope jsonb,
  p_format_version integer,
  p_client_saved_at timestamptz
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_id bigint;
begin
  if v_user is null then
    raise exception 'urb_unauthenticated' using errcode = '28000';
  end if;
  if octet_length(p_envelope::text) > 1048576 then
    raise exception 'urb_too_large' using errcode = '54000';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_user::text, 0));

  if exists (select 1 from public.urb_save_stashes where user_id = v_user and city_id = p_city_id and client_saved_at = p_client_saved_at and envelope = p_envelope) then
    return (select -id from public.urb_save_stashes where user_id = v_user and city_id = p_city_id and client_saved_at = p_client_saved_at order by id desc limit 1);
  end if;

  insert into public.urb_save_stashes (user_id, city_id, format_version, envelope, client_saved_at)
    values (v_user, p_city_id, p_format_version, p_envelope, p_client_saved_at)
    returning id into v_id;

  delete from public.urb_save_stashes
    where user_id = v_user and city_id = p_city_id
      and id <= coalesce((select id from public.urb_save_stashes where user_id = v_user and city_id = p_city_id order by id desc offset 3 limit 1), 0);

  return -v_id;
end;
$$;

create or replace function public.urb_list_saves(p_city_id uuid)
returns table (revision bigint, format_version integer, client_saved_at timestamptz, created_at timestamptz, updated_at timestamptz)
language sql
security definer
set search_path = ''
stable
as $$
  select v.revision, v.format_version, v.client_saved_at, v.created_at, v.updated_at
  from (
    select s.revision, s.format_version, s.client_saved_at, s.created_at, s.updated_at
    from public.urb_saves s
    where s.user_id = auth.uid() and s.city_id = p_city_id
    union all
    select -t.id, t.format_version, t.client_saved_at, t.created_at, t.created_at
    from public.urb_save_stashes t
    where t.user_id = auth.uid() and t.city_id = p_city_id
  ) v
  order by (v.revision < 0), abs(v.revision) desc;
$$;

create or replace function public.urb_restore_save(p_city_id uuid, p_revision bigint)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_format integer;
  v_envelope jsonb;
  v_saved_at timestamptz;
  v_next bigint;
begin
  if v_user is null then
    raise exception 'urb_unauthenticated' using errcode = '28000';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_user::text, 0));

  if p_revision < 0 then
    select format_version, envelope, client_saved_at into v_format, v_envelope, v_saved_at
      from public.urb_save_stashes where user_id = v_user and city_id = p_city_id and id = -p_revision;
  else
    select format_version, envelope, client_saved_at into v_format, v_envelope, v_saved_at
      from public.urb_saves where user_id = v_user and city_id = p_city_id and revision = p_revision;
  end if;
  if not found then
    raise exception 'urb_not_found' using errcode = 'P0002';
  end if;

  select coalesce(max(revision), 0) + 1 into v_next from public.urb_saves where user_id = v_user and city_id = p_city_id;

  insert into public.urb_saves (user_id, city_id, revision, format_version, envelope, client_saved_at)
    values (v_user, p_city_id, v_next, v_format, v_envelope, v_saved_at);

  delete from public.urb_saves
    where user_id = v_user and city_id = p_city_id
      and revision < (select revision from public.urb_saves where user_id = v_user and city_id = p_city_id order by revision desc offset 9 limit 1);

  return v_next;
end;
$$;

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
  delete from public.urb_save_stashes where user_id = auth.uid() and city_id = p_city_id;
  delete from public.urb_city_leases where user_id = auth.uid() and city_id = p_city_id;
end;
$$;

revoke execute on function public.urb_stash_save(uuid, jsonb, integer, timestamptz) from public, anon;
grant execute on function public.urb_stash_save(uuid, jsonb, integer, timestamptz) to authenticated;
