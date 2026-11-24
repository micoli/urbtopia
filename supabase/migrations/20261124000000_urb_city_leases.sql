-- Active device: one device plays a City at a time, held by a short lease (ADR 0095).
-- The lease lapses by itself after two minutes without a renewal, so a closed tab never blocks another device.

create table public.urb_city_leases (
  user_id uuid not null references auth.users (id) on delete cascade,
  city_id uuid not null,
  device_id text not null check (char_length(device_id) between 1 and 64),
  expires_at timestamptz not null,
  constraint urb_city_leases_pkey primary key (user_id, city_id)
);

alter table public.urb_city_leases enable row level security;
revoke all on public.urb_city_leases from public, anon, authenticated;

create function public.urb_claim_city(p_city_id uuid, p_device_id text, p_force boolean default false)
returns table (held boolean, holder text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_lease public.urb_city_leases;
begin
  if v_user is null then
    raise exception 'urb_unauthenticated' using errcode = '28000';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_user::text, 0));

  select * into v_lease from public.urb_city_leases where user_id = v_user and city_id = p_city_id;

  if found and v_lease.device_id <> p_device_id and v_lease.expires_at > now() and not p_force then
    return query select false, v_lease.device_id;
    return;
  end if;

  insert into public.urb_city_leases (user_id, city_id, device_id, expires_at)
    values (v_user, p_city_id, p_device_id, now() + interval '2 minutes')
    on conflict (user_id, city_id) do update set device_id = excluded.device_id, expires_at = excluded.expires_at;

  return query select true, p_device_id;
end;
$$;

drop function public.urb_push_save(uuid, bigint, jsonb, integer, timestamptz, boolean);

create function public.urb_push_save(
  p_city_id uuid,
  p_base_revision bigint,
  p_envelope jsonb,
  p_format_version integer,
  p_client_saved_at timestamptz,
  p_keep_previous boolean default false,
  p_device_id text default null
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_current public.urb_saves;
  v_lease public.urb_city_leases;
  v_next bigint;
begin
  if v_user is null then
    raise exception 'urb_unauthenticated' using errcode = '28000';
  end if;
  if octet_length(p_envelope::text) > 1048576 then
    raise exception 'urb_too_large' using errcode = '54000';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_user::text, 0));

  if p_device_id is not null then
    select * into v_lease from public.urb_city_leases where user_id = v_user and city_id = p_city_id;
    if found and v_lease.device_id <> p_device_id and v_lease.expires_at > now() then
      raise exception 'urb_not_active' using errcode = 'P0001', detail = v_lease.device_id;
    end if;
    insert into public.urb_city_leases (user_id, city_id, device_id, expires_at)
      values (v_user, p_city_id, p_device_id, now() + interval '2 minutes')
      on conflict (user_id, city_id) do update set device_id = excluded.device_id, expires_at = excluded.expires_at;
  end if;

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

revoke execute on function public.urb_claim_city(uuid, text, boolean) from public, anon;
revoke execute on function public.urb_push_save(uuid, bigint, jsonb, integer, timestamptz, boolean, text) from public, anon;

grant execute on function public.urb_claim_city(uuid, text, boolean) to authenticated;
grant execute on function public.urb_push_save(uuid, bigint, jsonb, integer, timestamptz, boolean, text) to authenticated;
