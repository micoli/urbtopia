create table public.urb_donations (
  id uuid primary key,
  user_id uuid not null references public.urb_profiles (user_id) on delete cascade,
  value bigint not null check (value > 0 and value <= 9007199254740991),
  created_at timestamptz not null default now()
);

create index urb_donations_user_idx on public.urb_donations (user_id);
alter table public.urb_donations enable row level security;
revoke all on public.urb_donations from public, anon, authenticated;

alter table public.urb_medals drop constraint urb_medals_pkey;
alter table public.urb_medals alter column challenge_id drop not null;
alter table public.urb_medals add column id uuid not null default gen_random_uuid() primary key;
alter table public.urb_medals add unique (user_id, challenge_id);
create unique index urb_medals_milestone_idx on public.urb_medals (user_id, medal_code) where challenge_id is null;

create function public.urb_record_donations(p_donations jsonb default '[]'::jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := public.urb_social_member();
  v_donation jsonb;
  v_id uuid;
  v_value bigint;
  v_total numeric;
  v_tier text;
  v_medal jsonb;
  v_updated integer;
begin
  if jsonb_typeof(p_donations) is distinct from 'array' or jsonb_array_length(p_donations) > 100 then
    raise exception 'urb_donation_invalid' using errcode = '22023';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(v_user::text, 7));
  for v_donation in select value from jsonb_array_elements(p_donations) loop
    if jsonb_typeof(v_donation -> 'value') is distinct from 'number'
       or (v_donation ->> 'value') !~ '^[0-9]+$'
       or (v_donation ->> 'value')::numeric < 1
       or (v_donation ->> 'value')::numeric > 9007199254740991 then
      raise exception 'urb_donation_invalid' using errcode = '22023';
    end if;
    v_id := (v_donation ->> 'id')::uuid;
    v_value := (v_donation ->> 'value')::bigint;
    insert into public.urb_donations (id, user_id, value) values (v_id, v_user, v_value) on conflict do nothing;
    if not exists (select 1 from public.urb_donations where id = v_id and user_id = v_user and value = v_value) then
      raise exception 'urb_donation_invalid' using errcode = '22023';
    end if;
  end loop;
  select coalesce(sum(value), 0) into v_total from public.urb_donations where user_id = v_user;
  if v_total > 9007199254740991 then
    raise exception 'urb_donation_invalid' using errcode = '22023';
  end if;
  v_tier := case when v_total >= 100000 then 'or' when v_total >= 10000 then 'argent' when v_total >= 1000 then 'bronze' end;
  if v_tier is not null then
    insert into public.urb_medals (user_id, challenge_id, medal_code, name_fr, name_en)
      values (v_user, null, 'solidarity', 'Ville solidaire — ' || v_tier,
        'Solidary city — ' || case v_tier when 'or' then 'gold' when 'argent' then 'silver' else 'bronze' end)
      on conflict (user_id, medal_code) where challenge_id is null do update
        set name_fr = excluded.name_fr, name_en = excluded.name_en, earned_at = now()
        where public.urb_medals.name_fr is distinct from excluded.name_fr;
    get diagnostics v_updated = row_count;
    if v_updated > 0 then
      perform public.urb_bump_social(v_user);
      perform public.urb_bump_friends(v_user);
    end if;
  end if;
  select jsonb_build_object('medalCode', medal_code, 'nameFr', name_fr, 'nameEn', name_en, 'earnedAt', earned_at)
    into v_medal from public.urb_medals where user_id = v_user and medal_code = 'solidarity' and challenge_id is null;
  return jsonb_build_object('value', v_total, 'medal', v_medal);
end;
$$;

revoke execute on function public.urb_record_donations(jsonb) from public, anon;
grant execute on function public.urb_record_donations(jsonb) to authenticated;
