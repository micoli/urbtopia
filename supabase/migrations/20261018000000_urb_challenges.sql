-- Challenges: Daily challenges and Events dispatched by the server (ADR 0031).
-- The server publishes the goals, stamps the acceptance with its own clock and records single completions and Medals.
-- It never checks stocks. Every object created here is prefixed `urb_`.

create table public.urb_challenge_templates (
  id integer generated always as identity primary key,
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  band integer not null check (band >= 0),
  goal jsonb not null check (public.urb_lot_is_valid(goal))
);

alter table public.urb_challenge_templates enable row level security;
revoke all on public.urb_challenge_templates from public, anon, authenticated;

-- A band is the Citizens threshold that unlocks every item of the goal.
insert into public.urb_challenge_templates (difficulty, band, goal) values
  ('easy', 0, '[{"item":"wood","quantity":20},{"item":"stone","quantity":10}]'),
  ('easy', 0, '[{"item":"planks","quantity":6},{"item":"wood","quantity":10}]'),
  ('medium', 0, '[{"item":"bricks","quantity":10},{"item":"planks","quantity":8}]'),
  ('medium', 0, '[{"item":"planks","quantity":12},{"item":"stone","quantity":15}]'),
  ('hard', 0, '[{"item":"bricks","quantity":18},{"item":"planks","quantity":14},{"item":"stone","quantity":20}]'),
  ('easy', 100, '[{"item":"fish","quantity":10},{"item":"clay","quantity":10}]'),
  ('medium', 100, '[{"item":"cannedFish","quantity":6},{"item":"tiles","quantity":8}]'),
  ('hard', 100, '[{"item":"cannedFish","quantity":12},{"item":"tools","quantity":6},{"item":"tiles","quantity":12}]'),
  ('easy', 200, '[{"item":"silicon","quantity":8},{"item":"metal","quantity":8}]'),
  ('medium', 200, '[{"item":"glass","quantity":6},{"item":"circuits","quantity":4}]'),
  ('hard', 200, '[{"item":"circuits","quantity":8},{"item":"glass","quantity":8},{"item":"cannedFish","quantity":6}]'),
  ('easy', 600, '[{"item":"coal","quantity":10},{"item":"sand","quantity":10}]'),
  ('medium', 600, '[{"item":"steel","quantity":5},{"item":"cement","quantity":6}]'),
  ('hard', 600, '[{"item":"steel","quantity":10},{"item":"cement","quantity":10},{"item":"circuits","quantity":6}]');

create table public.urb_challenges (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('daily', 'event')),
  difficulty text check (difficulty in ('easy', 'medium', 'hard')),
  min_citizens integer not null default 0 check (min_citizens >= 0),
  goal jsonb not null check (public.urb_lot_is_valid(goal)),
  reward_kind text not null check (reward_kind in ('urbs', 'medal')),
  medal_code text check (medal_code ~ '^[A-Za-z0-9_-]{1,40}$'),
  name_keys jsonb not null,
  name_fr text,
  name_en text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at),
  check ((kind = 'daily' and difficulty is not null and reward_kind = 'urbs' and medal_code is null)
      or (kind = 'event' and difficulty is null and reward_kind = 'medal' and medal_code is not null))
);

create unique index urb_challenges_daily_key on public.urb_challenges (starts_at, difficulty, min_citizens) where kind = 'daily';
create index urb_challenges_active_idx on public.urb_challenges (ends_at);

alter table public.urb_challenges enable row level security;
revoke all on public.urb_challenges from public, anon, authenticated;

create table public.urb_challenge_acceptances (
  challenge_id uuid not null references public.urb_challenges (id) on delete cascade,
  user_id uuid not null references public.urb_profiles (user_id) on delete cascade,
  state text not null default 'accepted' check (state in ('accepted', 'completed', 'expired')),
  accepted_at timestamptz not null default now(),
  deadline timestamptz not null,
  completed_at timestamptz,
  primary key (user_id, challenge_id)
);

-- A player has at most one accepted Challenge at a time.
create unique index urb_challenge_acceptances_one_active on public.urb_challenge_acceptances (user_id) where state = 'accepted';
create index urb_challenge_acceptances_deadline_idx on public.urb_challenge_acceptances (deadline) where state = 'accepted';

alter table public.urb_challenge_acceptances enable row level security;
revoke all on public.urb_challenge_acceptances from public, anon, authenticated;

create table public.urb_medals (
  user_id uuid not null references public.urb_profiles (user_id) on delete cascade,
  challenge_id uuid not null,
  medal_code text not null,
  earned_at timestamptz not null default now(),
  primary key (user_id, challenge_id)
);

create index urb_medals_user_idx on public.urb_medals (user_id, earned_at);

alter table public.urb_medals enable row level security;
revoke all on public.urb_medals from public, anon, authenticated;

-- Publishes today's Daily challenges: one per difficulty and band, drawn from the templates. Idempotent for a day.
create function public.urb_generate_daily_challenges()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_day timestamptz := date_trunc('day', now() at time zone 'utc') at time zone 'utc';
  v_pair record;
  v_goal jsonb;
begin
  for v_pair in select distinct difficulty, band from public.urb_challenge_templates loop
    select t.goal into v_goal from public.urb_challenge_templates t
      where t.difficulty = v_pair.difficulty and t.band = v_pair.band order by random() limit 1;
    insert into public.urb_challenges (kind, difficulty, min_citizens, goal, reward_kind, name_keys, starts_at, ends_at)
      values ('daily', v_pair.difficulty, v_pair.band, v_goal, 'urbs',
              jsonb_build_object('hook', floor(random() * 1000)::integer, 'item', v_goal -> 0 ->> 'item'),
              v_day, v_day + interval '1 day')
      on conflict do nothing;
  end loop;
end;
$$;

-- Publishes an Event by hand (run as the database owner, never exposed to clients):
--   select public.urb_create_event('port-festival', '{"item":"planks"}'::jsonb, 'Fête du port', 'Port festival',
--     '[{"item":"planks","quantity":50}]', now(), now() + interval '3 days', 0);
create function public.urb_create_event(
  p_medal_code text,
  p_name_keys jsonb,
  p_name_fr text,
  p_name_en text,
  p_goal jsonb,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_min_citizens integer default 0
)
returns uuid
language sql
security definer
set search_path = ''
as $$
  insert into public.urb_challenges (kind, min_citizens, goal, reward_kind, medal_code, name_keys, name_fr, name_en, starts_at, ends_at)
    values ('event', p_min_citizens, p_goal, 'medal', p_medal_code, p_name_keys, p_name_fr, p_name_en, p_starts_at, p_ends_at)
    returning id;
$$;

-- Closes an accepted Challenge whose deadline has passed; its stock is lost.
create function public.urb_settle_acceptance(p_user uuid, p_challenge uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.urb_challenge_acceptances set state = 'expired'
    where user_id = p_user and challenge_id = p_challenge and state = 'accepted' and deadline <= now();
$$;

create function public.urb_expire_challenges()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.urb_challenge_acceptances set state = 'expired' where state = 'accepted' and deadline <= now();
  delete from public.urb_challenges where ends_at < now() - interval '30 days';
end;
$$;

create function public.urb_challenge_json(p_challenge public.urb_challenges)
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select jsonb_build_object(
    'id', p_challenge.id,
    'kind', p_challenge.kind,
    'difficulty', p_challenge.difficulty,
    'minCitizens', p_challenge.min_citizens,
    'goal', p_challenge.goal,
    'rewardKind', p_challenge.reward_kind,
    'medalCode', p_challenge.medal_code,
    'nameKeys', p_challenge.name_keys,
    'nameFr', p_challenge.name_fr,
    'nameEn', p_challenge.name_en,
    'startsAt', p_challenge.starts_at,
    'endsAt', p_challenge.ends_at
  );
$$;

-- The Challenges open now, the player's accepted one and their Medals.
create function public.urb_list_challenges()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := public.urb_social_member();
begin
  perform public.urb_expire_challenges();
  return jsonb_build_object(
    'now', now(),
    'challenges', coalesce((
      select jsonb_agg(public.urb_challenge_json(c) order by c.kind, c.starts_at, c.min_citizens, c.difficulty)
      from public.urb_challenges c where c.starts_at <= now() and c.ends_at > now()
    ), '[]'::jsonb),
    'accepted', (
      select jsonb_build_object('challengeId', a.challenge_id, 'acceptedAt', a.accepted_at, 'deadline', a.deadline)
      from public.urb_challenge_acceptances a where a.user_id = v_user and a.state = 'accepted'
    ),
    'medals', coalesce((
      select jsonb_agg(jsonb_build_object('challengeId', m.challenge_id, 'medalCode', m.medal_code, 'earnedAt', m.earned_at) order by m.earned_at)
      from public.urb_medals m where m.user_id = v_user
    ), '[]'::jsonb)
  );
end;
$$;

-- Accepts a Challenge: stamped with the server clock, refused while another one is accepted. Idempotent.
create function public.urb_accept_challenge(p_challenge uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := public.urb_social_member();
  v_challenge public.urb_challenges;
  v_acceptance public.urb_challenge_acceptances;
begin
  perform pg_advisory_xact_lock(hashtextextended(v_user::text, 5));
  perform public.urb_expire_challenges();

  select * into v_acceptance from public.urb_challenge_acceptances where user_id = v_user and challenge_id = p_challenge;
  if found then
    if v_acceptance.state <> 'accepted' then
      raise exception 'urb_challenge_unavailable' using errcode = 'P0002';
    end if;
    return jsonb_build_object('challengeId', p_challenge, 'acceptedAt', v_acceptance.accepted_at, 'deadline', v_acceptance.deadline);
  end if;

  select * into v_challenge from public.urb_challenges where id = p_challenge and starts_at <= now() and ends_at > now();
  if not found then
    raise exception 'urb_challenge_unavailable' using errcode = 'P0002';
  end if;
  if exists (select 1 from public.urb_challenge_acceptances where user_id = v_user and state = 'accepted') then
    raise exception 'urb_challenge_busy' using errcode = 'P0001';
  end if;

  insert into public.urb_challenge_acceptances (challenge_id, user_id, deadline)
    values (p_challenge, v_user, case when v_challenge.kind = 'daily' then now() + interval '24 hours' else v_challenge.ends_at end)
    returning * into v_acceptance;
  return jsonb_build_object('challengeId', p_challenge, 'acceptedAt', v_acceptance.accepted_at, 'deadline', v_acceptance.deadline);
end;
$$;

-- Declares the stock complete. Checks the deadline and the single claim only. Answers with what to apply locally,
-- again on a repeated declaration, so a client that lost the first answer can still credit it (its ledger credits it once).
create function public.urb_declare_challenge(p_challenge uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := public.urb_social_member();
  v_challenge public.urb_challenges;
  v_acceptance public.urb_challenge_acceptances;
  v_already boolean;
begin
  perform pg_advisory_xact_lock(hashtextextended(v_user::text, 5));
  perform public.urb_settle_acceptance(v_user, p_challenge);

  select * into v_acceptance from public.urb_challenge_acceptances
    where user_id = v_user and challenge_id = p_challenge for update;
  if not found or v_acceptance.state = 'expired' then
    raise exception 'urb_challenge_unavailable' using errcode = 'P0002';
  end if;
  select * into v_challenge from public.urb_challenges where id = p_challenge;

  v_already := v_acceptance.state = 'completed';
  if not v_already then
    update public.urb_challenge_acceptances set state = 'completed', completed_at = now()
      where user_id = v_user and challenge_id = p_challenge;
    if v_challenge.reward_kind = 'medal' then
      insert into public.urb_medals (user_id, challenge_id, medal_code) values (v_user, p_challenge, v_challenge.medal_code)
        on conflict do nothing;
    end if;
  end if;

  return jsonb_build_object(
    'challengeId', p_challenge,
    'rewardKind', v_challenge.reward_kind,
    'goal', v_challenge.goal,
    'medalCode', v_challenge.medal_code,
    'alreadyClaimed', v_already
  );
end;
$$;

revoke execute on function public.urb_generate_daily_challenges() from public, anon, authenticated;
revoke execute on function public.urb_create_event(text, jsonb, text, text, jsonb, timestamptz, timestamptz, integer) from public, anon, authenticated;
revoke execute on function public.urb_settle_acceptance(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.urb_expire_challenges() from public, anon, authenticated;
revoke execute on function public.urb_challenge_json(public.urb_challenges) from public, anon, authenticated;
revoke execute on function public.urb_list_challenges() from public, anon;
revoke execute on function public.urb_accept_challenge(uuid) from public, anon;
revoke execute on function public.urb_declare_challenge(uuid) from public, anon;

select cron.schedule('urb_generate_daily_challenges', '5 0 * * *', 'select public.urb_generate_daily_challenges()');
select cron.schedule('urb_expire_challenges', '*/5 * * * *', 'select public.urb_expire_challenges()');
