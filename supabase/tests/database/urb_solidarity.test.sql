begin;
create extension if not exists pgtap with schema extensions;
select plan(20);

insert into auth.users (id, instance_id, aud, role, email, email_confirmed_at, is_anonymous, created_at, last_sign_in_at)
  select ('00000000-0000-0000-0007-0000000000' || n)::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'solidarity-' || n || '@example.com', now(), false, now(), now()
  from unnest(array['0a', '0b']) n;
insert into public.urb_profiles (user_id, handle) values
  ('00000000-0000-0000-0007-00000000000a', 'Donor'),
  ('00000000-0000-0000-0007-00000000000b', 'Friend');
insert into public.urb_friendships (user_low, user_high, state, actor_id) values
  ('00000000-0000-0000-0007-00000000000a', '00000000-0000-0000-0007-00000000000b', 'accepted', '00000000-0000-0000-0007-00000000000a');

create function pg_temp.act_as(p_user text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', ('00000000-0000-0000-0007-' || p_user)::uuid, 'role', 'authenticated')::text, true);
$$;

select ok((select relrowsecurity from pg_class where oid = 'public.urb_donations'::regclass), 'Donation receipts have RLS');
select ok(not has_function_privilege('anon', 'public.urb_record_donations(jsonb)', 'execute'), 'anonymous callers cannot record donations');
select ok(not has_table_privilege('authenticated', 'public.urb_donations', 'select'), 'clients cannot read receipt tables directly');
select ok(not has_table_privilege('authenticated', 'public.urb_donations', 'insert'), 'clients cannot insert receipt rows directly');

set local role authenticated;
select pg_temp.act_as('00000000000a');
select is((public.urb_record_donations() ->> 'value')::bigint, 0::bigint, 'a new account has no donation value');
select is(jsonb_typeof(public.urb_record_donations() -> 'medal'), 'null', 'no Medal is earned before Bronze');
select is((public.urb_record_donations('[{"id":"10000000-0000-4000-8000-000000000001","value":1000}]') ->> 'value')::bigint, 1000::bigint, 'a donation adds value');
select is((public.urb_record_donations('[{"id":"10000000-0000-4000-8000-000000000001","value":1000}]') ->> 'value')::bigint, 1000::bigint, 'a retried donation counts once');
select is(public.urb_record_donations() -> 'medal' ->> 'nameFr', 'Ville solidaire — bronze', 'Bronze is earned at 1000');
select ok(exists(select 1 from jsonb_array_elements(public.urb_list_challenges() -> 'medals') m where m ->> 'medalCode' = 'solidarity' and m -> 'challengeId' = 'null'::jsonb), 'the generic Medal list includes the Donation Medal');
select is((public.urb_record_donations('[{"id":"10000000-0000-4000-8000-000000000002","value":9000}]') ->> 'value')::bigint, 10000::bigint, 'donations from another city add to account progress');
select is(public.urb_record_donations() -> 'medal' ->> 'nameEn', 'Solidary city — silver', 'the same Medal evolves to Silver');
select is((select count(*)::int from jsonb_array_elements(public.urb_list_challenges() -> 'medals') m where m ->> 'medalCode' = 'solidarity'), 1, 'the Donation Medal appears only once');
select is(public.urb_record_donations('[{"id":"10000000-0000-4000-8000-000000000003","value":90000}]') -> 'medal' ->> 'nameFr', 'Ville solidaire — or', 'Gold is earned at 100000');

select pg_temp.act_as('00000000000b');
select is((public.urb_record_donations() ->> 'value')::bigint, 0::bigint, 'another account has independent progress');
select throws_ok($$ select public.urb_record_donations('[{"id":"10000000-0000-4000-8000-000000000001","value":1000}]') $$, '22023', 'urb_donation_invalid', 'a receipt cannot be attributed to another account');
select ok(exists(select 1 from jsonb_array_elements(public.urb_list_social() -> 'friends') f, jsonb_array_elements(f -> 'medals') m where m ->> 'nameFr' = 'Ville solidaire — or'), 'Friends can see the current Medal tier');

select pg_temp.act_as('00000000000a');
select throws_ok($$ select public.urb_record_donations('[{"id":"10000000-0000-4000-8000-000000000001","value":2000}]') $$, '22023', 'urb_donation_invalid', 'a receipt cannot be replayed with a different value');
select throws_ok($$ select public.urb_record_donations('[{"id":"10000000-0000-4000-8000-000000000004","value":-1}]') $$, '22023', 'urb_donation_invalid', 'negative value is refused');
select throws_ok($$ select public.urb_record_donations('[{"id":"10000000-0000-4000-8000-000000000004","value":1.5}]') $$, '22023', 'urb_donation_invalid', 'fractional value is refused');

reset role;
select finish();
rollback;
