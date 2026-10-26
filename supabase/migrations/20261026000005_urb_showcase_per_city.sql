-- Showcase and Hall of fame per City (ADR 0047): each City has its own Showcase, its own opt-out and its own ranking entry,
-- so one account may appear several times. A City's first publication is capped like the later ones (ADR 0029).
-- Rows made before Cities existed belong to the first City.

create function public.urb_default_city_name(p_seed text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when coalesce(trim(regexp_replace(replace(coalesce(p_seed, ''), '-', ' '), '\s*[0-9]+\s*$', '')), '') = '' then 'City'
    else initcap(trim(regexp_replace(replace(p_seed, '-', ' '), '\s*[0-9]+\s*$', '')))
  end;
$$;

revoke execute on function public.urb_default_city_name(text) from public, anon, authenticated;

alter table public.urb_showcase add column city_id uuid not null default '00000000-0000-0000-0000-000000000001';
alter table public.urb_showcase alter column city_id drop default;
alter table public.urb_showcase add column city_name text;
alter table public.urb_showcase add column blocked_city_name text;
update public.urb_showcase set city_name = public.urb_default_city_name(envelope #>> '{state,seed}');
alter table public.urb_showcase alter column city_name set not null;
alter table public.urb_showcase add constraint urb_showcase_city_name_check check (char_length(city_name) between 1 and 32);
alter table public.urb_showcase drop constraint urb_showcase_pkey;
alter table public.urb_showcase add constraint urb_showcase_pkey primary key (user_id, city_id);

-- The opt-out is a choice made City by City.
create table public.urb_hall_of_fame_opt_outs (
  user_id uuid not null references public.urb_profiles (user_id) on delete cascade,
  city_id uuid not null,
  primary key (user_id, city_id)
);

alter table public.urb_hall_of_fame_opt_outs enable row level security;
revoke all on public.urb_hall_of_fame_opt_outs from public, anon, authenticated;

insert into public.urb_hall_of_fame_opt_outs (user_id, city_id)
  select user_id, '00000000-0000-0000-0000-000000000001' from public.urb_profiles where hall_of_fame_opted_out;
alter table public.urb_profiles drop column hall_of_fame_opted_out;

drop function public.urb_publish_showcase(jsonb, integer, integer);
drop function public.urb_get_showcase(uuid);
drop function public.urb_showcase_status();
drop function public.urb_set_hall_of_fame_opt_out(boolean);

-- The name other players read: the City's own, unless it is empty, too long, forbidden or was reset by an Admin.
create function public.urb_visible_city_name(p_name text, p_seed text, p_blocked text)
returns text
language sql
stable
set search_path = ''
as $$
  select case
    when p_name is null or char_length(trim(p_name)) not between 1 and 32 then public.urb_default_city_name(p_seed)
    when exists (select 1 from public.urb_forbidden_handle_words w where position(w.word in lower(p_name)) > 0) then public.urb_default_city_name(p_seed)
    when p_blocked is not null and lower(trim(p_name)) = lower(p_blocked) then public.urb_default_city_name(p_seed)
    else trim(p_name)
  end;
$$;

revoke execute on function public.urb_visible_city_name(text, text, text) from public, anon, authenticated;

-- Replaces the Showcase of one City. A ranking value growing faster than the cap is held back: the Showcase is still replaced.
-- The first publication of a City enters the ranking at the floor and climbs from there.
create function public.urb_publish_showcase(p_city uuid, p_city_name text, p_envelope jsonb, p_format_version integer, p_citizens integer)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := public.urb_social_member();
  v_profile public.urb_profiles;
  v_current public.urb_showcase;
  v_ranking integer;
  v_name text;
  v_exists boolean;
begin
  if p_city is null then
    raise exception 'urb_showcase_invalid' using errcode = 'P0001';
  end if;
  if octet_length(p_envelope::text) > 1048576 then
    raise exception 'urb_too_large' using errcode = '54000';
  end if;
  if p_citizens is null or p_citizens < 0 or p_citizens > 100000000 then
    raise exception 'urb_showcase_invalid' using errcode = 'P0001';
  end if;

  select * into v_profile from public.urb_profiles where user_id = v_user;
  if exists (select 1 from public.urb_hall_of_fame_opt_outs where user_id = v_user and city_id = p_city) then
    return;
  end if;
  if not v_profile.hall_of_fame_notice_seen then
    raise exception 'urb_notice_required' using errcode = 'P0001';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_user::text, 1));
  select * into v_current from public.urb_showcase where user_id = v_user and city_id = p_city;
  v_exists := found;
  v_name := public.urb_visible_city_name(p_city_name, p_envelope #>> '{state,seed}', v_current.blocked_city_name);

  if not v_exists then
    insert into public.urb_showcase (user_id, city_id, city_name, envelope, format_version, citizens, ranking_citizens)
      values (v_user, p_city, v_name, p_envelope, p_format_version, p_citizens, least(p_citizens, 500));
    return;
  end if;

  v_ranking := public.urb_showcase_allowed_ranking(v_current.ranking_citizens, v_current.ranking_at, p_citizens);
  update public.urb_showcase
    set city_name = v_name, envelope = p_envelope, format_version = p_format_version, citizens = p_citizens, updated_at = now(),
        ranking_citizens = v_ranking,
        ranking_at = case when v_ranking = p_citizens or v_ranking <> v_current.ranking_citizens then now() else v_current.ranking_at end
    where user_id = v_user and city_id = p_city;
end;
$$;

create or replace function public.urb_hall_of_fame()
returns jsonb
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
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'userId', ranked.user_id, 'cityId', ranked.city_id, 'cityName', ranked.city_name,
      'handle', ranked.handle, 'avatar', ranked.avatar,
      'citizens', ranked.ranking_citizens, 'rank', ranked.place
    ) order by ranked.place)
    from (
      select s.user_id, s.city_id, s.city_name, p.handle, p.avatar, s.ranking_citizens,
             row_number() over (order by s.ranking_citizens desc, s.created_at, s.user_id, s.city_id) as place
      from public.urb_showcase s
      join public.urb_profiles p on p.user_id = s.user_id
      where s.user_id <> v_user
        and not exists (select 1 from public.urb_hall_of_fame_opt_outs o where o.user_id = s.user_id and o.city_id = s.city_id)
        and not exists (
          select 1 from public.urb_friendships f
          where f.state = 'blocked' and f.user_low = least(s.user_id, v_user) and f.user_high = greatest(s.user_id, v_user)
        )
      order by place
      limit 10
    ) ranked
  ), '[]'::jsonb);
end;
$$;

create function public.urb_get_showcase(p_user uuid, p_city uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
stable
as $$
declare
  v_user uuid := auth.uid();
  v_row record;
begin
  if v_user is null then
    raise exception 'urb_unauthenticated' using errcode = '28000';
  end if;
  select s.envelope, s.format_version, s.city_name, p.handle, p.avatar into v_row
    from public.urb_showcase s join public.urb_profiles p on p.user_id = s.user_id
    where s.user_id = p_user and s.city_id = p_city
      and not exists (select 1 from public.urb_hall_of_fame_opt_outs o where o.user_id = s.user_id and o.city_id = s.city_id)
      and not exists (
        select 1 from public.urb_friendships f
        where f.state = 'blocked' and f.user_low = least(p_user, v_user) and f.user_high = greatest(p_user, v_user)
          and p_user <> v_user
      );
  if not found then
    raise exception 'urb_not_found' using errcode = 'P0001';
  end if;
  return jsonb_build_object('handle', v_row.handle, 'avatar', v_row.avatar, 'cityName', v_row.city_name, 'formatVersion', v_row.format_version, 'envelope', v_row.envelope);
end;
$$;

create function public.urb_showcase_status(p_city uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
stable
as $$
declare
  v_user uuid := public.urb_social_member();
  v_profile public.urb_profiles;
begin
  select * into v_profile from public.urb_profiles where user_id = v_user;
  return jsonb_build_object(
    'optedOut', exists (select 1 from public.urb_hall_of_fame_opt_outs where user_id = v_user and city_id = p_city),
    'noticeSeen', v_profile.hall_of_fame_notice_seen
  );
end;
$$;

create function public.urb_set_hall_of_fame_opt_out(p_city uuid, p_opted_out boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := public.urb_social_member();
begin
  update public.urb_profiles set hall_of_fame_notice_seen = true where user_id = v_user;
  if p_opted_out then
    insert into public.urb_hall_of_fame_opt_outs (user_id, city_id) values (v_user, p_city) on conflict do nothing;
    delete from public.urb_showcase where user_id = v_user and city_id = p_city;
  else
    delete from public.urb_hall_of_fame_opt_outs where user_id = v_user and city_id = p_city;
  end if;
end;
$$;

revoke execute on function public.urb_publish_showcase(uuid, text, jsonb, integer, integer) from public, anon;
revoke execute on function public.urb_get_showcase(uuid, uuid) from public, anon;
revoke execute on function public.urb_showcase_status(uuid) from public, anon;
revoke execute on function public.urb_set_hall_of_fame_opt_out(uuid, boolean) from public, anon;
grant execute on function public.urb_publish_showcase(uuid, text, jsonb, integer, integer) to authenticated;
grant execute on function public.urb_get_showcase(uuid, uuid) to authenticated;
grant execute on function public.urb_showcase_status(uuid) to authenticated;
grant execute on function public.urb_set_hall_of_fame_opt_out(uuid, boolean) to authenticated;
