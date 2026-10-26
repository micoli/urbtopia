begin;
create extension if not exists pgtap with schema extensions;
select plan(38);

insert into auth.users (id, instance_id, aud, role, email, email_confirmed_at, is_anonymous, created_at, last_sign_in_at) values
  ('00000000-0000-0000-0003-00000000000a', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'a@example.com', now(), false, now(), now()),
  ('00000000-0000-0000-0003-00000000000b', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'b@example.com', now(), false, now(), now()),
  ('00000000-0000-0000-0003-00000000000c', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'c@example.com', now(), false, now(), now()),
  ('00000000-0000-0000-0003-00000000000d', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', null, null, true, now(), now());

create function pg_temp.act_as(p_user text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', ('00000000-0000-0000-0003-' || p_user)::uuid, 'role', 'authenticated')::text, true);
$$;

create function pg_temp.forbidden_word() returns text language sql security definer as $$
  select word from public.urb_forbidden_handle_words limit 1;
$$;

set local role authenticated;
select pg_temp.act_as('00000000000a');
select public.urb_set_handle('Alice');
select pg_temp.act_as('00000000000b');
select public.urb_set_handle('Bob');
select pg_temp.act_as('00000000000c');
select public.urb_set_handle('Carol');

select pg_temp.act_as('00000000000a');
select throws_ok($$ select public.urb_publish_showcase('00000000-0000-0000-0000-000000000001', null, '{"state":{}}'::jsonb, 16, 100) $$, 'urb_notice_required', 'publishing waits for the notice to be seen');
select is(public.urb_showcase_status('00000000-0000-0000-0000-000000000001'), '{"optedOut": false, "noticeSeen": false}'::jsonb, 'a new account is in by default and has not seen the notice');
select public.urb_mark_hall_of_fame_notice_seen();
select lives_ok($$ select public.urb_publish_showcase('00000000-0000-0000-0000-000000000001', null, '{"state":{}}'::jsonb, 16, 100) $$, 'publishing works once the notice is seen');
select throws_ok($$ select public.urb_publish_showcase('00000000-0000-0000-0000-000000000001', null, '{"state":{}}'::jsonb, 16, -1) $$, 'urb_showcase_invalid', 'a negative Citizens count is refused');

select pg_temp.act_as('00000000000d');
select throws_ok($$ select public.urb_publish_showcase('00000000-0000-0000-0000-000000000001', null, '{"state":{}}'::jsonb, 16, 100) $$, 'urb_email_required', 'an anonymous account cannot publish');

select pg_temp.act_as('00000000000b');
select public.urb_mark_hall_of_fame_notice_seen();
select public.urb_publish_showcase('00000000-0000-0000-0000-000000000001', null, '{"state":{"who":"bob"}}'::jsonb, 16, 300);
select pg_temp.act_as('00000000000c');
select public.urb_mark_hall_of_fame_notice_seen();
select public.urb_publish_showcase('00000000-0000-0000-0000-000000000001', null, '{"state":{"who":"carol"}}'::jsonb, 16, 200);

select pg_temp.act_as('00000000000d');
select is(
  (select jsonb_agg(e ->> 'handle' order by (e ->> 'rank')::int) from jsonb_array_elements(public.urb_hall_of_fame()) e),
  '["Bob", "Carol", "Alice"]'::jsonb,
  'an anonymous account reads the ranking, biggest first'
);
select is(public.urb_hall_of_fame() -> 0 ->> 'citizens', '300', 'an entry carries the Citizens count');
select ok(not (public.urb_hall_of_fame() -> 0 ? 'envelope'), 'the ranking carries no city');
select is(public.urb_get_showcase('00000000-0000-0000-0003-00000000000b', '00000000-0000-0000-0000-000000000001') -> 'envelope' -> 'state' ->> 'who', 'bob', 'an anonymous account can fetch a Showcase');

select pg_temp.act_as('00000000000a');
select public.urb_publish_showcase('00000000-0000-0000-0000-000000000001', null, '{"state":{"who":"alice2"}}'::jsonb, 16, 150);
select pg_temp.act_as('00000000000d');
select is((select e ->> 'citizens' from jsonb_array_elements(public.urb_hall_of_fame()) e where e ->> 'handle' = 'Alice'), '150', 'growth within the cap moves the ranking');
select pg_temp.act_as('00000000000a');
select public.urb_publish_showcase('00000000-0000-0000-0000-000000000001', null, '{"state":{"who":"alice3"}}'::jsonb, 16, 5000000);
select pg_temp.act_as('00000000000d');
select is((select e ->> 'citizens' from jsonb_array_elements(public.urb_hall_of_fame()) e where e ->> 'handle' = 'Alice'), '150', 'growth beyond the cap keeps the previous ranking value');
select is(public.urb_get_showcase('00000000-0000-0000-0003-00000000000a', '00000000-0000-0000-0000-000000000001') -> 'envelope' -> 'state' ->> 'who', 'alice3', 'the Showcase is still replaced');
select pg_temp.act_as('00000000000a');
select public.urb_publish_showcase('00000000-0000-0000-0000-000000000001', null, '{"state":{}}'::jsonb, 16, 10);
select pg_temp.act_as('00000000000d');
select is((select e ->> 'citizens' from jsonb_array_elements(public.urb_hall_of_fame()) e where e ->> 'handle' = 'Alice'), '10', 'a shrinking city lowers its rank at once');

select pg_temp.act_as('00000000000a');
select is(
  (select jsonb_agg(e ->> 'handle' order by (e ->> 'rank')::int) from jsonb_array_elements(public.urb_hall_of_fame()) e),
  '["Bob", "Carol"]'::jsonb,
  'the player''s own city is not listed, and the ranks count only the others'
);

select pg_temp.act_as('00000000000b');
select public.urb_block_user('00000000-0000-0000-0003-00000000000c');
select is(
  (select count(*) from jsonb_array_elements(public.urb_hall_of_fame()) e where e ->> 'handle' = 'Carol'), 0::bigint,
  'a Block hides the blocked account from the blocker'
);
select throws_ok($$ select public.urb_get_showcase('00000000-0000-0000-0003-00000000000c', '00000000-0000-0000-0000-000000000001') $$, 'urb_not_found', 'a blocked Showcase cannot be fetched');
select pg_temp.act_as('00000000000c');
select is(
  (select count(*) from jsonb_array_elements(public.urb_hall_of_fame()) e where e ->> 'handle' = 'Bob'), 0::bigint,
  'a Block hides the blocker from the blocked account'
);

select pg_temp.act_as('00000000000b');
select public.urb_unblock_user('00000000-0000-0000-0003-00000000000c');
select public.urb_set_hall_of_fame_opt_out('00000000-0000-0000-0000-000000000001', true);
select pg_temp.act_as('00000000000d');
select is(
  (select count(*) from jsonb_array_elements(public.urb_hall_of_fame()) e where e ->> 'handle' = 'Bob'), 0::bigint,
  'opting out removes the account from the ranking'
);
select throws_ok($$ select public.urb_get_showcase('00000000-0000-0000-0003-00000000000b', '00000000-0000-0000-0000-000000000001') $$, 'urb_not_found', 'opting out deletes the Showcase');
select pg_temp.act_as('00000000000b');
select lives_ok($$ select public.urb_publish_showcase('00000000-0000-0000-0000-000000000001', null, '{"state":{}}'::jsonb, 16, 400) $$, 'publishing while opted out is silently ignored');
select pg_temp.act_as('00000000000d');
select is(
  (select count(*) from jsonb_array_elements(public.urb_hall_of_fame()) e where e ->> 'handle' = 'Bob'), 0::bigint,
  'an opted-out account stays out'
);

-- Cities: each City has its own Showcase, name, ranking entry and opt-out
reset role;
update public.urb_profiles set hall_of_fame_notice_seen = true where user_id in ('00000000-0000-0000-0003-00000000000a', '00000000-0000-0000-0003-00000000000b');
set local role authenticated;
select pg_temp.act_as('00000000000a');
select lives_ok($$ select public.urb_publish_showcase('00000000-0000-0000-0000-0000000000c2', 'Second Town', '{"state":{"seed":"gently-amber-fox-4821","who":"alice-c2"}}'::jsonb, 16, 9000) $$, 'a second City publishes its own Showcase');
select pg_temp.act_as('00000000000d');
select is((select e ->> 'cityName' from jsonb_array_elements(public.urb_hall_of_fame()) e where e ->> 'handle' = 'Alice' and e ->> 'cityId' = '00000000-0000-0000-0000-0000000000c2'), 'Second Town', 'the ranking shows the City name');
select is((select e ->> 'citizens' from jsonb_array_elements(public.urb_hall_of_fame()) e where e ->> 'handle' = 'Alice' and e ->> 'cityId' = '00000000-0000-0000-0000-0000000000c2'), '500', 'the first publication of a City enters at the floor, whatever it declares');
select is((select count(*) from jsonb_array_elements(public.urb_hall_of_fame()) e where e ->> 'handle' = 'Alice'), 2::bigint, 'one account can hold several entries');
select is(public.urb_get_showcase('00000000-0000-0000-0003-00000000000a', '00000000-0000-0000-0000-0000000000c2') ->> 'cityName', 'Second Town', 'a Visit names the City');
select is(public.urb_get_showcase('00000000-0000-0000-0003-00000000000a', '00000000-0000-0000-0000-0000000000c2') -> 'envelope' -> 'state' ->> 'who', 'alice-c2', 'and loads that City, not another one');
select pg_temp.act_as('00000000000a');
select public.urb_set_hall_of_fame_opt_out('00000000-0000-0000-0000-0000000000c2', true);
select is(public.urb_showcase_status('00000000-0000-0000-0000-0000000000c2') ->> 'optedOut', 'true', 'the opt-out is recorded for that City');
select is(public.urb_showcase_status('00000000-0000-0000-0000-000000000001') ->> 'optedOut', 'false', 'and not for the others');
select pg_temp.act_as('00000000000d');
select throws_ok($$ select public.urb_get_showcase('00000000-0000-0000-0003-00000000000a', '00000000-0000-0000-0000-0000000000c2') $$, 'urb_not_found', 'nor can it be fetched');
select pg_temp.act_as('00000000000a');
select lives_ok($$ select public.urb_publish_showcase('00000000-0000-0000-0000-0000000000c3', 'x', '{"state":{"seed":"calm-owl-1000"}}'::jsonb, 16, 10) $$, 'a City publishes with a name that is too short but fine');
reset role;
select is((select city_name from public.urb_showcase where city_id = '00000000-0000-0000-0000-0000000000c3'), 'x', 'its name is kept');
set local role authenticated;
select pg_temp.act_as('00000000000a');
select public.urb_publish_showcase('00000000-0000-0000-0000-0000000000c3', ('My ' || pg_temp.forbidden_word()), '{"state":{"seed":"calm-owl-1000"}}'::jsonb, 16, 10);
reset role;
select is((select city_name from public.urb_showcase where city_id = '00000000-0000-0000-0000-0000000000c3'), 'Calm Owl', 'a forbidden name falls back to the Seed-based default');
update public.urb_showcase set city_name = 'Calm Owl', blocked_city_name = 'Rude Name' where city_id = '00000000-0000-0000-0000-0000000000c3';
set local role authenticated;
select pg_temp.act_as('00000000000a');
select public.urb_publish_showcase('00000000-0000-0000-0000-0000000000c3', 'rude name', '{"state":{"seed":"calm-owl-1000"}}'::jsonb, 16, 10);
reset role;
select is((select city_name from public.urb_showcase where city_id = '00000000-0000-0000-0000-0000000000c3'), 'Calm Owl', 'a name an Admin reset does not come back with the next publication');
set local role authenticated;
select pg_temp.act_as('00000000000a');
select public.urb_publish_showcase('00000000-0000-0000-0000-0000000000c3', 'Another Name', '{"state":{"seed":"calm-owl-1000"}}'::jsonb, 16, 10);
reset role;
select is((select city_name from public.urb_showcase where city_id = '00000000-0000-0000-0000-0000000000c3'), 'Another Name', 'but another name does');
set local role authenticated;

select pg_temp.act_as('00000000000c');
select public.urb_delete_my_saves();
select pg_temp.act_as('00000000000d');
select throws_ok($$ select public.urb_get_showcase('00000000-0000-0000-0003-00000000000c', '00000000-0000-0000-0000-000000000001') $$, 'urb_not_found', 'deleting cloud data deletes the Showcase');

-- Deleting a City takes its Showcase and its opt-out with it
select pg_temp.act_as('00000000000a');
select public.urb_delete_city_saves('00000000-0000-0000-0000-0000000000c3');
select public.urb_delete_city_saves('00000000-0000-0000-0000-0000000000c2');
reset role;
select is((select count(*) from public.urb_showcase where city_id = '00000000-0000-0000-0000-0000000000c3'), 0::bigint, 'deleting a City deletes its Showcase');
select is((select count(*) from public.urb_hall_of_fame_opt_outs where city_id = '00000000-0000-0000-0000-0000000000c2'), 0::bigint, 'and its Hall of fame opt-out');

select * from finish();
rollback;
