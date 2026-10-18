-- Cloud saves: keep 10 revisions per player instead of 5.

create or replace function public.urb_push_save(
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
      and revision < (select revision from public.urb_saves where user_id = v_user order by revision desc offset 9 limit 1);

  return v_next;
end;
$$;

create or replace function public.urb_restore_save(p_revision bigint)
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
      and revision < (select revision from public.urb_saves where user_id = v_user order by revision desc offset 9 limit 1);

  return v_next;
end;
$$;
