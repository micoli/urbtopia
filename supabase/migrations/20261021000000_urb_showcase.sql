-- Hall of fame: the Showcase of a city and the ranking of the biggest ones (ADR 0029).
-- Written and read only through urb_* functions. Every object created here is prefixed `urb_`.

alter table public.urb_profiles
  add column hall_of_fame_opted_out boolean not null default false,
  add column hall_of_fame_notice_seen boolean not null default false;

create table public.urb_showcase (
  user_id uuid primary key references public.urb_profiles (user_id) on delete cascade,
  envelope jsonb not null,
  format_version integer not null,
  citizens integer not null check (citizens >= 0),
  ranking_citizens integer not null check (ranking_citizens >= 0),
  ranking_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index urb_showcase_ranking_idx on public.urb_showcase (ranking_citizens desc, created_at);

alter table public.urb_showcase enable row level security;
revoke all on public.urb_showcase from public, anon, authenticated;

create function public.urb_showcase_allowed_ranking(p_previous integer, p_since timestamptz, p_declared integer)
returns integer
language sql
stable
set search_path = ''
as $$
  select case
    when p_declared <= p_previous then p_declared
    when p_declared <= p_previous + ceil(greatest(p_previous * 0.2, 500) * greatest(extract(epoch from (now() - p_since)) / 3600, 1))::integer then p_declared
    else p_previous
  end;
$$;

-- Replaces the caller's Showcase. A ranking value growing faster than the cap is held back: the Showcase is still replaced.
create function public.urb_publish_showcase(p_envelope jsonb, p_format_version integer, p_citizens integer)
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
begin
  if octet_length(p_envelope::text) > 1048576 then
    raise exception 'urb_too_large' using errcode = '54000';
  end if;
  if p_citizens is null or p_citizens < 0 or p_citizens > 100000000 then
    raise exception 'urb_showcase_invalid' using errcode = 'P0001';
  end if;

  select * into v_profile from public.urb_profiles where user_id = v_user;
  if v_profile.hall_of_fame_opted_out then
    return;
  end if;
  if not v_profile.hall_of_fame_notice_seen then
    raise exception 'urb_notice_required' using errcode = 'P0001';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_user::text, 1));
  select * into v_current from public.urb_showcase where user_id = v_user;

  if not found then
    insert into public.urb_showcase (user_id, envelope, format_version, citizens, ranking_citizens)
      values (v_user, p_envelope, p_format_version, p_citizens, p_citizens);
    return;
  end if;

  v_ranking := public.urb_showcase_allowed_ranking(v_current.ranking_citizens, v_current.ranking_at, p_citizens);
  update public.urb_showcase
    set envelope = p_envelope, format_version = p_format_version, citizens = p_citizens, updated_at = now(),
        ranking_citizens = v_ranking,
        ranking_at = case when v_ranking = p_citizens or v_ranking <> v_current.ranking_citizens then now() else v_current.ranking_at end
    where user_id = v_user;
end;
$$;

create function public.urb_hall_of_fame()
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
      'userId', ranked.user_id, 'handle', ranked.handle, 'avatar', ranked.avatar,
      'citizens', ranked.ranking_citizens, 'rank', ranked.place
    ) order by ranked.place)
    from (
      select s.user_id, p.handle, p.avatar, s.ranking_citizens,
             row_number() over (order by s.ranking_citizens desc, p.created_at, s.user_id) as place
      from public.urb_showcase s
      join public.urb_profiles p on p.user_id = s.user_id
      where not p.hall_of_fame_opted_out
        and not exists (
          select 1 from public.urb_friendships f
          where f.state = 'blocked' and f.user_low = least(s.user_id, v_user) and f.user_high = greatest(s.user_id, v_user)
            and s.user_id <> v_user
        )
      order by place
      limit 10
    ) ranked
  ), '[]'::jsonb);
end;
$$;

-- Not visible looks the same as not existing.
create function public.urb_get_showcase(p_user uuid)
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
  select s.envelope, s.format_version, p.handle, p.avatar into v_row
    from public.urb_showcase s join public.urb_profiles p on p.user_id = s.user_id
    where s.user_id = p_user and not p.hall_of_fame_opted_out
      and not exists (
        select 1 from public.urb_friendships f
        where f.state = 'blocked' and f.user_low = least(p_user, v_user) and f.user_high = greatest(p_user, v_user)
          and p_user <> v_user
      );
  if not found then
    raise exception 'urb_not_found' using errcode = 'P0001';
  end if;
  return jsonb_build_object('handle', v_row.handle, 'avatar', v_row.avatar, 'formatVersion', v_row.format_version, 'envelope', v_row.envelope);
end;
$$;

create function public.urb_showcase_status()
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
  return jsonb_build_object('optedOut', v_profile.hall_of_fame_opted_out, 'noticeSeen', v_profile.hall_of_fame_notice_seen);
end;
$$;

create function public.urb_mark_hall_of_fame_notice_seen()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := public.urb_social_member();
begin
  update public.urb_profiles set hall_of_fame_notice_seen = true where user_id = v_user;
end;
$$;

create function public.urb_set_hall_of_fame_opt_out(p_opted_out boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := public.urb_social_member();
begin
  update public.urb_profiles
    set hall_of_fame_opted_out = p_opted_out, hall_of_fame_notice_seen = true
    where user_id = v_user;
  if p_opted_out then
    delete from public.urb_showcase where user_id = v_user;
  end if;
end;
$$;

revoke execute on function public.urb_showcase_allowed_ranking(integer, timestamptz, integer) from public, anon, authenticated;
revoke execute on function public.urb_publish_showcase(jsonb, integer, integer) from public, anon;
revoke execute on function public.urb_hall_of_fame() from public, anon;
revoke execute on function public.urb_get_showcase(uuid) from public, anon;
revoke execute on function public.urb_showcase_status() from public, anon;
revoke execute on function public.urb_mark_hall_of_fame_notice_seen() from public, anon;
revoke execute on function public.urb_set_hall_of_fame_opt_out(boolean) from public, anon;
