begin;
create extension if not exists pgtap with schema extensions;
select plan(38);

insert into auth.users (id, instance_id, aud, role, email, email_confirmed_at, is_anonymous, created_at, last_sign_in_at)
  select ('00000000-0000-0000-0006-0000000000' || n)::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', n || '@example.com', now(), false, now(), now()
  from unnest(array['0a', '0b']) n;
insert into auth.users (id, instance_id, aud, role, is_anonymous, created_at, last_sign_in_at)
  values ('00000000-0000-0000-0006-00000000000c', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', true, now(), now());
insert into public.urb_profiles (user_id, handle) values
  ('00000000-0000-0000-0006-00000000000a', 'Alice'),
  ('00000000-0000-0000-0006-00000000000b', 'Bob');

create function pg_temp.act_as(p_user text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', ('00000000-0000-0000-0006-' || p_user)::uuid, 'role', 'authenticated')::text, true);
$$;

select ok((select relrowsecurity from pg_class where oid = 'public.urb_challenges'::regclass), 'urb_challenges has row level security enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.urb_challenge_acceptances'::regclass), 'urb_challenge_acceptances has row level security enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.urb_medals'::regclass), 'urb_medals has row level security enabled');
select cmp_ok((select count(*)::int from cron.job where jobname in ('urb_generate_daily_challenges', 'urb_expire_challenges')), '=', 2, 'both cron jobs are scheduled');

-- Daily generation
select lives_ok($$ select public.urb_generate_daily_challenges() $$, 'daily challenges are generated');
select is((select count(*)::int from public.urb_challenges where kind = 'daily'), 12, 'one Daily challenge per difficulty and band');
select lives_ok($$ select public.urb_generate_daily_challenges() $$, 'generating again is idempotent');
select is((select count(*)::int from public.urb_challenges where kind = 'daily'), 12, 'no duplicate after a second generation');
select is((select count(distinct difficulty)::int from public.urb_challenges where kind = 'daily'), 3, 'the three difficulties are published');
select ok((select bool_and(public.urb_lot_is_valid(goal) and reward_kind = 'urbs' and ends_at - starts_at = interval '1 day') from public.urb_challenges where kind = 'daily'), 'Daily challenges are valid, paid in Urbs and last a day');
select ok((select bool_and(name_keys ? 'hook' and name_keys ? 'item') from public.urb_challenges where kind = 'daily'), 'Daily challenges carry name keys');

-- An Event is published by hand
select lives_ok($$ select public.urb_create_event('port-festival', '{"item":"planks"}', 'Fête du port', 'Port festival', '[{"item":"planks","quantity":50}]', now() - interval '1 hour', now() + interval '3 days') $$, 'an Event is created');
select throws_ok($$ select public.urb_create_event('x', '{}', null, null, '[]', now(), now() + interval '1 day') $$, '23514', null, 'an Event with an invalid goal is refused');
create function pg_temp.event_id() returns uuid language sql security definer as $$
  select id from public.urb_challenges where kind = 'event';
$$;
create function pg_temp.event_ends_at() returns timestamptz language sql security definer as $$
  select ends_at from public.urb_challenges where kind = 'event';
$$;
create function pg_temp.daily_id() returns uuid language sql security definer as $$
  select id from public.urb_challenges where kind = 'daily' and difficulty = 'easy' and min_citizens = 0;
$$;
create function pg_temp.accepted_state(p_user text) returns text language sql security definer as $$
  select state from public.urb_challenge_acceptances where user_id = ('00000000-0000-0000-0006-' || p_user)::uuid and challenge_id = pg_temp.daily_id();
$$;

-- Access
set local role authenticated;
select pg_temp.act_as('00000000000c');
select throws_ok($$ select public.urb_list_challenges() $$, 'urb_email_required', 'an account without email cannot list Challenges');
reset role;
delete from public.urb_profiles where user_id = '00000000-0000-0000-0006-00000000000b';
set local role authenticated;
select pg_temp.act_as('00000000000b');
select throws_ok($$ select public.urb_list_challenges() $$, 'urb_handle_required', 'an account without Handle cannot list Challenges');
reset role;
insert into public.urb_profiles (user_id, handle) values ('00000000-0000-0000-0006-00000000000b', 'Bob');
set local role authenticated;

-- Listing
select pg_temp.act_as('00000000000a');
select is(jsonb_array_length(public.urb_list_challenges() -> 'challenges'), 13, 'the 12 Daily challenges and the Event are listed');
select is(jsonb_typeof(public.urb_list_challenges() -> 'accepted'), 'null', 'nothing is accepted yet');
select throws_ok($$ select public.urb_accept_challenge(gen_random_uuid()) $$, 'urb_challenge_unavailable', 'an unknown Challenge cannot be accepted');

-- Accepting
select lives_ok($$ select public.urb_accept_challenge(pg_temp.daily_id()) $$, 'a Daily challenge is accepted');
select is(
  (select (public.urb_accept_challenge(pg_temp.daily_id()) ->> 'deadline')::timestamptz - (public.urb_list_challenges() -> 'accepted' ->> 'acceptedAt')::timestamptz),
  interval '24 hours', 'a Daily deadline is 24 hours after the acceptance');
select is(public.urb_list_challenges() -> 'accepted' ->> 'challengeId', pg_temp.daily_id()::text, 'the accepted Challenge is listed');
select throws_ok($$ select public.urb_accept_challenge(pg_temp.event_id()) $$, 'urb_challenge_busy', 'a second Challenge is refused while one is accepted');

-- Declaring
select throws_ok($$ select public.urb_declare_challenge(pg_temp.event_id()) $$, 'urb_challenge_unavailable', 'declaring a Challenge that was not accepted is refused');
select is(public.urb_declare_challenge(pg_temp.daily_id()) ->> 'rewardKind', 'urbs', 'declaring answers with the reward kind');
select is((public.urb_declare_challenge(pg_temp.daily_id()) ->> 'alreadyClaimed')::boolean, true, 'declaring again answers already claimed');
select is(jsonb_array_length(public.urb_declare_challenge(pg_temp.daily_id()) -> 'goal'), 2, 'declaring answers with the goal');
select is(jsonb_typeof(public.urb_list_challenges() -> 'accepted'), 'null', 'a completed Challenge is no longer accepted');
select throws_ok($$ select public.urb_accept_challenge(pg_temp.daily_id()) $$, 'urb_challenge_unavailable', 'a completed Challenge cannot be accepted again');

-- Event and Medal
select lives_ok($$ select public.urb_accept_challenge(pg_temp.event_id()) $$, 'an Event is accepted once the Daily is done');
select is((public.urb_list_challenges() -> 'accepted' ->> 'deadline')::timestamptz, pg_temp.event_ends_at(), 'an Event deadline is its end date');
select is(public.urb_declare_challenge(pg_temp.event_id()) ->> 'medalCode', 'port-festival', 'declaring an Event answers with its Medal');
select is(jsonb_array_length(public.urb_list_challenges() -> 'medals'), 1, 'the Medal is listed');

-- Isolation and deadline
select pg_temp.act_as('00000000000b');
select is(jsonb_array_length(public.urb_list_challenges() -> 'medals'), 0, 'another player sees none of those Medals');
select lives_ok($$ select public.urb_accept_challenge(pg_temp.daily_id()) $$, 'another player accepts the same Daily challenge');
reset role;
update public.urb_challenge_acceptances set deadline = now() - interval '1 minute' where user_id = '00000000-0000-0000-0006-00000000000b';
set local role authenticated;
select pg_temp.act_as('00000000000b');
select throws_ok($$ select public.urb_declare_challenge(pg_temp.daily_id()) $$, 'urb_challenge_unavailable', 'declaring after the deadline is refused');
select is(jsonb_typeof(public.urb_list_challenges() -> 'accepted'), 'null', 'an expired acceptance frees the player');
select is(pg_temp.accepted_state('00000000000b'), 'expired', 'an acceptance past its deadline is expired once listed');

reset role;
select is((select count(*)::int from public.urb_medals), 1, 'only the Event completion produced a Medal');
select finish();
rollback;
