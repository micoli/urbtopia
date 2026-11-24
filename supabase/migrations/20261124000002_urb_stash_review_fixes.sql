-- Review fixes for the stashes (ADR 0095): deleting the cloud data clears them and the leases too,
-- and a City that has no save cannot take stashes, so the 3-City cap of urb_push_save also bounds them.

-- Deleting cloud data also clears the stashes and the leases.
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
  delete from public.urb_save_stashes where user_id = v_user;
  delete from public.urb_city_leases where user_id = v_user;

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

create or replace function public.urb_stash_save(
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

  if not exists (select 1 from public.urb_saves where user_id = v_user and city_id = p_city_id) then
    raise exception 'urb_not_found' using errcode = 'P0002';
  end if;

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
