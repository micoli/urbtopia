begin;
create extension if not exists pgtap with schema extensions;
select plan(11);

insert into auth.users (id, instance_id, aud, role, email, email_confirmed_at, is_anonymous, created_at, last_sign_in_at)
  select ('00000000-0000-0000-0009-0000000000' || n)::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'achievements-' || n || '@example.com', now(), false, now(), now()
  from unnest(array['0a', '0b']) n;
insert into public.urb_profiles (user_id, handle) values
  ('00000000-0000-0000-0009-00000000000a', 'Builder'),
  ('00000000-0000-0000-0009-00000000000b', 'Friend');
insert into public.urb_friendships (user_low, user_high, state, actor_id) values
  ('00000000-0000-0000-0009-00000000000a', '00000000-0000-0000-0009-00000000000b', 'accepted', '00000000-0000-0000-0009-00000000000a');

create function pg_temp.act_as(p_user text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', ('00000000-0000-0000-0009-' || p_user)::uuid, 'role', 'authenticated')::text, true);
$$;

select ok(not has_function_privilege('anon', 'public.urb_record_achievement_medal(text, text, text)', 'execute'), 'anonymous callers cannot record an Achievement Medal');

set local role authenticated;
select pg_temp.act_as('00000000000a');
select is((public.urb_record_achievement_medal('transport', 'Succès : Transports', 'Achievements: Transport') ->> 'earned')::boolean, true, 'completing a category earns its Medal');
select is(public.urb_record_achievement_medal('transport', 'Succès : Transports', 'Achievements: Transport') ->> 'medalCode', 'achievements-transport', 'the Medal code is made from the category');
select is((public.urb_record_achievement_medal('transport', 'Succès : Transports', 'Achievements: Transport') ->> 'earned')::boolean, false, 'a retry or another City earns nothing more');
select is((select count(*)::int from jsonb_array_elements(public.urb_list_challenges('00000000-0000-0000-0000-000000000001') -> 'medals') m where m ->> 'medalCode' = 'achievements-transport'), 1, 'the Medal appears once in the Medal list');
select is((public.urb_record_achievement_medal('politics', 'Succès : Politique', 'Achievements: Politics') ->> 'earned')::boolean, true, 'each category has its own Medal');
select throws_ok($$ select public.urb_record_achievement_medal('Not A Category', 'a', 'b') $$, '22023', 'urb_achievement_invalid', 'a category code that is not a plain word is refused');
select throws_ok($$ select public.urb_record_achievement_medal('transport', '', 'b') $$, '22023', 'urb_achievement_invalid', 'an empty name is refused');
select throws_ok($$ select public.urb_record_achievement_medal('transport', 'a', repeat('x', 61)) $$, '22023', 'urb_achievement_invalid', 'a name over 60 characters is refused');

select pg_temp.act_as('00000000000b');
select is((public.urb_record_achievement_medal('transport', 'Succès : Transports', 'Achievements: Transport') ->> 'earned')::boolean, true, 'another account earns its own Medal');
select ok(exists(select 1 from jsonb_array_elements(public.urb_list_social() -> 'friends') f, jsonb_array_elements(f -> 'medals') m where m ->> 'medalCode' = 'achievements-transport'), 'Friends can see the Medal');

reset role;
select finish();
rollback;
