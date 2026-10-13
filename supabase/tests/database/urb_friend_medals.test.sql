begin;
create extension if not exists pgtap with schema extensions;
select plan(11);

insert into auth.users (id, instance_id, aud, role, email, email_confirmed_at, is_anonymous, created_at, last_sign_in_at)
  select ('00000000-0000-0000-0007-0000000000' || n)::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', n || '@example.com', now(), false, now(), now()
  from unnest(array['0a', '0b', '0c']) n;
insert into public.urb_profiles (user_id, handle) values
  ('00000000-0000-0000-0007-00000000000a', 'Alice'),
  ('00000000-0000-0000-0007-00000000000b', 'Bob'),
  ('00000000-0000-0000-0007-00000000000c', 'Carol');
insert into public.urb_friendships (user_low, user_high, state, actor_id) values
  ('00000000-0000-0000-0007-00000000000a', '00000000-0000-0000-0007-00000000000b', 'accepted', '00000000-0000-0000-0007-00000000000a'),
  ('00000000-0000-0000-0007-00000000000a', '00000000-0000-0000-0007-00000000000c', 'blocked', '00000000-0000-0000-0007-00000000000c');

create function pg_temp.act_as(p_user text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', ('00000000-0000-0000-0007-' || p_user)::uuid, 'role', 'authenticated')::text, true);
$$;
create function pg_temp.event_id() returns uuid language sql security definer as $$
  select id from public.urb_challenges where kind = 'event';
$$;

select lives_ok($$ select public.urb_create_event('port-festival', '{"item":"planks"}', 'Fête du port', 'Port festival', '[{"item":"planks","quantity":5}]', now() - interval '1 hour', now() + interval '3 days') $$, 'an Event is created');

set local role authenticated;
select pg_temp.act_as('00000000000b');
create temp table before_revision as select (public.urb_list_social() ->> 'revision')::bigint as revision;
select is(jsonb_array_length(public.urb_list_social() -> 'friends' -> 0 -> 'medals'), 0, 'a Friend without Medal shows an empty list');

select pg_temp.act_as('00000000000a');
select lives_ok($$ select public.urb_accept_challenge(pg_temp.event_id()) $$, 'Alice accepts the Event');
select lives_ok($$ select public.urb_declare_challenge(pg_temp.event_id()) $$, 'Alice completes the Event');

select pg_temp.act_as('00000000000b');
select is((public.urb_list_social((select revision from before_revision)) ->> 'changed')::boolean, true, 'earning a Medal changes the Friends state of Bob');
select is(public.urb_list_social() -> 'friends' -> 0 -> 'medals' -> 0 ->> 'medalCode', 'port-festival', 'Bob sees the Medal of Alice');

select is(public.urb_list_social() -> 'friends' -> 0 -> 'medals' -> 0 ->> 'nameFr', 'Fête du port', 'the Medal carries the French name of its Event');
select is(public.urb_list_social() -> 'friends' -> 0 -> 'medals' -> 0 ->> 'nameEn', 'Port festival', 'the Medal carries the English name of its Event');

select pg_temp.act_as('00000000000c');
select is(jsonb_array_length(public.urb_list_social() -> 'friends'), 0, 'a blocked account sees no Friend, so no Medal');

select pg_temp.act_as('00000000000a');
select is(jsonb_array_length(public.urb_list_challenges() -> 'medals'), 1, 'Alice sees her own Medal in the Challenge state');

select is(public.urb_list_challenges() -> 'medals' -> 0 ->> 'nameEn', 'Port festival', 'her own Medal carries its name');

select finish();
rollback;
