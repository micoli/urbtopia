-- Cloud saves per City: each Player account keeps up to three Cities, each with its own revision history (ADR 0047).
-- Rows saved before Cities existed belong to the first City, whose id is the fixed value below on every device.

alter table public.urb_saves add column city_id uuid not null default '00000000-0000-0000-0000-000000000001';
alter table public.urb_saves alter column city_id drop default;
alter table public.urb_saves drop constraint urb_saves_pkey;
alter table public.urb_saves add constraint urb_saves_pkey primary key (user_id, city_id, revision);

drop function public.urb_push_save(bigint, jsonb, integer, timestamptz, boolean);
drop function public.urb_list_saves();
drop function public.urb_restore_save(bigint);

create function public.urb_push_save(
  p_city_id uuid,
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

  select * into v_current from public.urb_saves where user_id = v_user and city_id = p_city_id order by revision desc limit 1;

  if v_current.revision is null
    and (select count(distinct city_id) from public.urb_saves where user_id = v_user) >= 3 then
    raise exception 'urb_city_limit' using errcode = '54000';
  end if;

  if coalesce(p_base_revision, 0) <> coalesce(v_current.revision, 0) then
    raise exception 'urb_conflict' using errcode = 'P0001', detail = coalesce(v_current.revision, 0)::text;
  end if;

  v_next := coalesce(v_current.revision, 0) + 1;

  if not p_keep_previous and v_current.revision is not null and v_current.created_at > now() - interval '1 hour' then
    update public.urb_saves
      set revision = v_next, envelope = p_envelope, format_version = p_format_version,
          client_saved_at = p_client_saved_at, updated_at = now()
      where user_id = v_user and city_id = p_city_id and revision = v_current.revision;
    return v_next;
  end if;

  insert into public.urb_saves (user_id, city_id, revision, format_version, envelope, client_saved_at)
    values (v_user, p_city_id, v_next, p_format_version, p_envelope, p_client_saved_at);

  delete from public.urb_saves
    where user_id = v_user and city_id = p_city_id
      and revision < (select revision from public.urb_saves where user_id = v_user and city_id = p_city_id order by revision desc offset 9 limit 1);

  return v_next;
end;
$$;

create function public.urb_list_saves(p_city_id uuid)
returns table (revision bigint, format_version integer, client_saved_at timestamptz, created_at timestamptz, updated_at timestamptz)
language sql
security definer
set search_path = ''
stable
as $$
  select s.revision, s.format_version, s.client_saved_at, s.created_at, s.updated_at
  from public.urb_saves s
  where s.user_id = auth.uid() and s.city_id = p_city_id
  order by s.revision desc;
$$;

create function public.urb_list_cities()
returns table (city_id uuid, revision bigint, client_saved_at timestamptz)
language sql
security definer
set search_path = ''
stable
as $$
  select distinct on (s.city_id) s.city_id, s.revision, s.client_saved_at
  from public.urb_saves s
  where s.user_id = auth.uid()
  order by s.city_id, s.revision desc;
$$;

create function public.urb_restore_save(p_city_id uuid, p_revision bigint)
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

  select * into v_source from public.urb_saves where user_id = v_user and city_id = p_city_id and revision = p_revision;
  if not found then
    raise exception 'urb_not_found' using errcode = 'P0002';
  end if;

  select coalesce(max(revision), 0) + 1 into v_next from public.urb_saves where user_id = v_user and city_id = p_city_id;

  insert into public.urb_saves (user_id, city_id, revision, format_version, envelope, client_saved_at)
    values (v_user, p_city_id, v_next, v_source.format_version, v_source.envelope, v_source.client_saved_at);

  delete from public.urb_saves
    where user_id = v_user and city_id = p_city_id
      and revision < (select revision from public.urb_saves where user_id = v_user and city_id = p_city_id order by revision desc offset 9 limit 1);

  return v_next;
end;
$$;

create function public.urb_delete_city_saves(p_city_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'urb_unauthenticated' using errcode = '28000';
  end if;
  delete from public.urb_saves where user_id = auth.uid() and city_id = p_city_id;
end;
$$;

revoke execute on function public.urb_push_save(uuid, bigint, jsonb, integer, timestamptz, boolean) from public, anon;
revoke execute on function public.urb_list_saves(uuid) from public, anon;
revoke execute on function public.urb_list_cities() from public, anon;
revoke execute on function public.urb_restore_save(uuid, bigint) from public, anon;
revoke execute on function public.urb_delete_city_saves(uuid) from public, anon;

grant execute on function public.urb_push_save(uuid, bigint, jsonb, integer, timestamptz, boolean) to authenticated;
grant execute on function public.urb_list_saves(uuid) to authenticated;
grant execute on function public.urb_list_cities() to authenticated;
grant execute on function public.urb_restore_save(uuid, bigint) to authenticated;
grant execute on function public.urb_delete_city_saves(uuid) to authenticated;
