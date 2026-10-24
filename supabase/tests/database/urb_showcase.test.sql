begin;
create extension if not exists pgtap with schema extensions;
select plan(22);

insert into auth.users (id, instance_id, aud, role, email, email_confirmed_at, is_anonymous, created_at, last_sign_in_at) values
  ('00000000-0000-0000-0003-00000000000a', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'a@example.com', now(), false, now(), now()),
  ('00000000-0000-0000-0003-00000000000b', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'b@example.com', now(), false, now(), now()),
  ('00000000-0000-0000-0003-00000000000c', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'c@example.com', now(), false, now(), now()),
  ('00000000-0000-0000-0003-00000000000d', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', null, null, true, now(), now());

create function pg_temp.act_as(p_user text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', ('00000000-0000-0000-0003-' || p_user)::uuid, 'role', 'authenticated')::text, true);
$$;

set local role authenticated;
select pg_temp.act_as('00000000000a');
select public.urb_set_handle('Alice');
select pg_temp.act_as('00000000000b');
select public.urb_set_handle('Bob');
select pg_temp.act_as('00000000000c');
select public.urb_set_handle('Carol');

select pg_temp.act_as('00000000000a');
select throws_ok($$ select public.urb_publish_showcase('{"state":{}}'::jsonb, 16, 100) $$, 'urb_notice_required', 'publishing waits for the notice to be seen');
select is(public.urb_showcase_status(), '{"optedOut": false, "noticeSeen": false}'::jsonb, 'a new account is in by default and has not seen the notice');
select public.urb_mark_hall_of_fame_notice_seen();
select lives_ok($$ select public.urb_publish_showcase('{"state":{}}'::jsonb, 16, 100) $$, 'publishing works once the notice is seen');
select throws_ok($$ select public.urb_publish_showcase('{"state":{}}'::jsonb, 16, -1) $$, 'urb_showcase_invalid', 'a negative Citizens count is refused');

select pg_temp.act_as('00000000000d');
select throws_ok($$ select public.urb_publish_showcase('{"state":{}}'::jsonb, 16, 100) $$, 'urb_email_required', 'an anonymous account cannot publish');

select pg_temp.act_as('00000000000b');
select public.urb_mark_hall_of_fame_notice_seen();
select public.urb_publish_showcase('{"state":{"who":"bob"}}'::jsonb, 16, 300);
select pg_temp.act_as('00000000000c');
select public.urb_mark_hall_of_fame_notice_seen();
select public.urb_publish_showcase('{"state":{"who":"carol"}}'::jsonb, 16, 200);

select pg_temp.act_as('00000000000d');
select is(
  (select jsonb_agg(e ->> 'handle' order by (e ->> 'rank')::int) from jsonb_array_elements(public.urb_hall_of_fame()) e),
  '["Bob", "Carol", "Alice"]'::jsonb,
  'an anonymous account reads the ranking, biggest first'
);
select is(public.urb_hall_of_fame() -> 0 ->> 'citizens', '300', 'an entry carries the Citizens count');
select ok(not (public.urb_hall_of_fame() -> 0 ? 'envelope'), 'the ranking carries no city');
select is(public.urb_get_showcase('00000000-0000-0000-0003-00000000000b') -> 'envelope' -> 'state' ->> 'who', 'bob', 'an anonymous account can fetch a Showcase');

select pg_temp.act_as('00000000000a');
select public.urb_publish_showcase('{"state":{"who":"alice2"}}'::jsonb, 16, 150);
select pg_temp.act_as('00000000000d');
select is((select e ->> 'citizens' from jsonb_array_elements(public.urb_hall_of_fame()) e where e ->> 'handle' = 'Alice'), '150', 'growth within the cap moves the ranking');
select pg_temp.act_as('00000000000a');
select public.urb_publish_showcase('{"state":{"who":"alice3"}}'::jsonb, 16, 5000000);
select pg_temp.act_as('00000000000d');
select is((select e ->> 'citizens' from jsonb_array_elements(public.urb_hall_of_fame()) e where e ->> 'handle' = 'Alice'), '150', 'growth beyond the cap keeps the previous ranking value');
select is(public.urb_get_showcase('00000000-0000-0000-0003-00000000000a') -> 'envelope' -> 'state' ->> 'who', 'alice3', 'the Showcase is still replaced');
select pg_temp.act_as('00000000000a');
select public.urb_publish_showcase('{"state":{}}'::jsonb, 16, 10);
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
select throws_ok($$ select public.urb_get_showcase('00000000-0000-0000-0003-00000000000c') $$, 'urb_not_found', 'a blocked Showcase cannot be fetched');
select pg_temp.act_as('00000000000c');
select is(
  (select count(*) from jsonb_array_elements(public.urb_hall_of_fame()) e where e ->> 'handle' = 'Bob'), 0::bigint,
  'a Block hides the blocker from the blocked account'
);

select pg_temp.act_as('00000000000b');
select public.urb_unblock_user('00000000-0000-0000-0003-00000000000c');
select public.urb_set_hall_of_fame_opt_out(true);
select pg_temp.act_as('00000000000d');
select is(
  (select count(*) from jsonb_array_elements(public.urb_hall_of_fame()) e where e ->> 'handle' = 'Bob'), 0::bigint,
  'opting out removes the account from the ranking'
);
select throws_ok($$ select public.urb_get_showcase('00000000-0000-0000-0003-00000000000b') $$, 'urb_not_found', 'opting out deletes the Showcase');
select pg_temp.act_as('00000000000b');
select lives_ok($$ select public.urb_publish_showcase('{"state":{}}'::jsonb, 16, 400) $$, 'publishing while opted out is silently ignored');
select pg_temp.act_as('00000000000d');
select is(
  (select count(*) from jsonb_array_elements(public.urb_hall_of_fame()) e where e ->> 'handle' = 'Bob'), 0::bigint,
  'an opted-out account stays out'
);

select pg_temp.act_as('00000000000c');
select public.urb_delete_my_saves();
select pg_temp.act_as('00000000000d');
select throws_ok($$ select public.urb_get_showcase('00000000-0000-0000-0003-00000000000c') $$, 'urb_not_found', 'deleting cloud data deletes the Showcase');

select * from finish();
rollback;
