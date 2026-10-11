begin;
create extension if not exists pgtap with schema extensions;
select plan(45);

-- Fixtures: a..f confirmed email accounts, x anonymous, h has an email but never sets a Handle
insert into auth.users (id, instance_id, aud, role, email, email_confirmed_at, is_anonymous, created_at, last_sign_in_at) values
  ('00000000-0000-0000-0001-00000000000a', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'a@example.com', now(), false, now(), now()),
  ('00000000-0000-0000-0001-00000000000b', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'b@example.com', now(), false, now(), now()),
  ('00000000-0000-0000-0001-00000000000c', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'c@example.com', now(), false, now(), now()),
  ('00000000-0000-0000-0001-00000000000d', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'd@example.com', now(), false, now(), now()),
  ('00000000-0000-0000-0001-00000000000e', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'e@example.com', now(), false, now(), now()),
  ('00000000-0000-0000-0001-00000000000f', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'f@example.com', now(), false, now(), now()),
  ('00000000-0000-0000-0001-000000000010', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'g@example.com', now(), false, now(), now()),
  ('00000000-0000-0000-0001-000000000011', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'h@example.com', now(), false, now(), now()),
  ('00000000-0000-0000-0001-0000000000a1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', null, null, true, now(), now());

create function pg_temp.act_as(p_user text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', ('00000000-0000-0000-0001-' || p_user)::uuid, 'role', 'authenticated')::text, true);
$$;

-- Structure
select is_empty(
  $$ select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity $$,
  'every table in public has row level security'
);
select is_empty(
  $$ select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relkind in ('r', 'v', 'm', 'S', 'i') and c.relname not like 'urb\_%' $$,
  'every relation in public is prefixed urb_'
);
select is_empty(
  $$ select p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     left join pg_depend d on d.objid = p.oid and d.deptype = 'e'
     where n.nspname = 'public' and d.objid is null and p.proname not like 'urb\_%' $$,
  'every function in public is prefixed urb_'
);

-- Multiplayer needs an email and a Handle
set local role authenticated;
select pg_temp.act_as('0000000000a1');
select throws_ok($$ select public.urb_set_handle('Anon') $$, 'urb_email_required', 'an anonymous account cannot take a Handle');
select pg_temp.act_as('000000000011');
select throws_ok($$ select public.urb_list_social() $$, 'urb_handle_required', 'an account without Handle cannot use social features');

-- Handle rules
select pg_temp.act_as('00000000000a');
select throws_ok($$ select public.urb_set_handle('a!') $$, 'urb_handle_invalid', 'a malformed Handle is refused');
select throws_ok($$ select public.urb_set_handle('SuperAdmin') $$, 'urb_handle_forbidden', 'a forbidden word is refused');
select lives_ok($$ select public.urb_set_handle('Alice') $$, 'a valid Handle is accepted');
select pg_temp.act_as('00000000000b');
select throws_ok($$ select public.urb_set_handle('alice') $$, 'urb_handle_taken', 'Handles are unique case-insensitively');
select lives_ok($$ select public.urb_set_handle('Bob') $$, 'B takes a Handle');
select pg_temp.act_as('00000000000c');
select lives_ok($$ select public.urb_set_handle('Carol') $$, 'C takes a Handle');
select pg_temp.act_as('00000000000d');
select lives_ok($$ select public.urb_set_handle('Dave') $$, 'D takes a Handle');
select lives_ok($$ select public.urb_set_findable(false) $$, 'D hides from email search');
select pg_temp.act_as('00000000000e');
select lives_ok($$ select public.urb_set_handle('Erin') $$, 'E takes a Handle');
select pg_temp.act_as('00000000000a');
select throws_ok($$ select public.urb_set_handle('Alicia') $$, 'urb_handle_change_too_soon', 'a Handle changes at most once every 30 days');
reset role;
update public.urb_profiles set handle_changed_at = now() - interval '31 days' where handle = 'Alice';
set local role authenticated;
select pg_temp.act_as('00000000000a');
select public.urb_set_handle('Alicia');
select is((public.urb_list_social() ->> 'handle'), 'Alicia', 'the Handle changes after 30 days');

-- Search is enumeration-safe
select is(
  (select public.urb_send_friend_request_by_email('nobody@example.com'))::text,
  (select public.urb_send_friend_request_by_email('d@example.com'))::text,
  'an unknown email and a non findable account answer the same way'
);
select is(jsonb_array_length(public.urb_list_social() -> 'outgoing'), 0, 'no request is created for an unknown or non findable account');
select public.urb_send_friend_request_by_email(' B@Example.com ');
select is(public.urb_list_social() -> 'outgoing' -> 0 ->> 'handle', 'Bob', 'a request by exact email is created, case-insensitively');
select ok(not (public.urb_list_social()::text like '%example.com%'), 'no email is ever returned');
select pg_temp.act_as('00000000000b');
select is(public.urb_list_social() -> 'incoming' -> 0 ->> 'handle', 'Alicia', 'the recipient sees the request with the sender Handle');

-- Accept, mutual request, refuse, remove
select public.urb_accept_friend_request(('00000000-0000-0000-0001-00000000000a')::uuid);
select is(public.urb_list_social() -> 'friends' -> 0 ->> 'handle', 'Alicia', 'accepting makes both users Friends');
select pg_temp.act_as('00000000000a');
select public.urb_send_friend_request_by_email('c@example.com');
select pg_temp.act_as('00000000000c');
select public.urb_send_friend_request_by_email('a@example.com');
select is(jsonb_array_length(public.urb_list_social() -> 'friends'), 1, 'a crossing request is accepted at once');
select public.urb_remove_friend(('00000000-0000-0000-0001-00000000000a')::uuid);
select pg_temp.act_as('00000000000a');
select is(jsonb_array_length(public.urb_list_social() -> 'friends'), 1, 'removing a Friend ends the link on both sides');
select public.urb_send_friend_request_by_email('e@example.com');
select throws_ok(
  $$ select public.urb_accept_friend_request(('00000000-0000-0000-0001-00000000000e')::uuid) $$,
  'urb_not_found',
  'the sender cannot accept their own request'
);
select pg_temp.act_as('00000000000e');
select public.urb_refuse_friend_request(('00000000-0000-0000-0001-00000000000a')::uuid);
select is(jsonb_array_length(public.urb_list_social() -> 'incoming'), 0, 'refusing deletes the request');

-- Block is silent
select pg_temp.act_as('00000000000b');
select public.urb_block_user(('00000000-0000-0000-0001-00000000000a')::uuid);
select is(public.urb_list_social() -> 'blocked' -> 0 ->> 'handle', 'Alicia', 'the blocker sees the blocked account');
select set_config('urb_test.blocker_revision', public.urb_list_social() ->> 'revision', true);
select pg_temp.act_as('00000000000a');
select is(
  (public.urb_list_social() -> 'blocked') = '[]'::jsonb and (public.urb_list_social() -> 'friends' -> 0 ->> 'handle') is distinct from 'Bob',
  true,
  'the blocked account sees no block and loses the Friend'
);
select public.urb_send_friend_request_by_email('b@example.com');
select public.urb_block_user(('00000000-0000-0000-0001-00000000000b')::uuid);
select public.urb_unblock_user(('00000000-0000-0000-0001-00000000000b')::uuid);
select is(public.urb_list_social() -> 'blocked', '[]'::jsonb, 'the blocked account cannot take over the block');
select pg_temp.act_as('00000000000b');
select is(public.urb_list_social() -> 'blocked' -> 0 ->> 'handle', 'Alicia', 'nor lift it by blocking then unblocking');
select is(jsonb_array_length(public.urb_list_social() -> 'incoming'), 0, 'a request from a blocked account is silently dropped');
select is(public.urb_list_social() ->> 'revision', current_setting('urb_test.blocker_revision'), 'the blocker is not bumped by any of it');
select lives_ok($$ select public.urb_block_user(('00000000-0000-0000-0001-00000000000a')::uuid) $$, 'blocking again is a no-op');
select public.urb_unblock_user(('00000000-0000-0000-0001-00000000000a')::uuid);
select is(jsonb_array_length(public.urb_list_social() -> 'blocked'), 0, 'unblocking clears the block');

-- Change cursor
select is(
  public.urb_list_social((public.urb_list_social() ->> 'revision')::bigint) ->> 'changed',
  'false',
  'a current cursor returns no change'
);

-- Isolation and direct writes
select is((select count(*) from public.urb_profiles), 1::bigint, 'a user reads only their own profile');
select throws_ok($$ select count(*) from public.urb_friendships $$, '42501', null, 'friendships are not readable directly');
select throws_ok($$ insert into public.urb_profiles (user_id, handle) values (gen_random_uuid(), 'Mallory') $$, '42501', null, 'direct insert is refused');
reset role;
set local role anon;
select throws_ok($$ select public.urb_list_social() $$, '42501', null, 'anon role cannot call social functions');
reset role;

-- Rate limit: 10 per hour
insert into public.urb_search_attempts (user_id, attempted_at)
  select '00000000-0000-0000-0001-00000000000f', now() - interval '10 minutes' from generate_series(1, 10);
insert into public.urb_profiles (user_id, handle) values ('00000000-0000-0000-0001-00000000000f', 'Frank');
set local role authenticated;
select pg_temp.act_as('00000000000f');
select throws_ok($$ select public.urb_send_friend_request_by_email('a@example.com') $$, 'urb_rate_limited', 'the 11th search within the hour is refused');

-- Caps: 20 outgoing requests, 50 Friends
reset role;
delete from public.urb_search_attempts;
insert into auth.users (id, instance_id, aud, role, email, email_confirmed_at, created_at)
  select ('00000000-0000-0000-0002-' || lpad(i::text, 12, '0'))::uuid, '00000000-0000-0000-0000-000000000000',
         'authenticated', 'authenticated', 'bulk' || i || '@example.com', now(), now()
  from generate_series(1, 50) i;
insert into public.urb_profiles (user_id, handle)
  select ('00000000-0000-0000-0002-' || lpad(i::text, 12, '0'))::uuid, 'bulk' || i from generate_series(1, 50) i;
insert into public.urb_profiles (user_id, handle) values ('00000000-0000-0000-0001-000000000010', 'Gina');
insert into public.urb_friendships (user_low, user_high, state, actor_id)
  select least(u, '00000000-0000-0000-0001-00000000000f'), greatest(u, '00000000-0000-0000-0001-00000000000f'), 'pending', '00000000-0000-0000-0001-00000000000f'
  from (select ('00000000-0000-0000-0002-' || lpad(i::text, 12, '0'))::uuid u from generate_series(1, 20) i) s;
insert into public.urb_friendships (user_low, user_high, state, actor_id)
  select least(u, '00000000-0000-0000-0001-000000000010'), greatest(u, '00000000-0000-0000-0001-000000000010'), 'accepted', u
  from (select ('00000000-0000-0000-0002-' || lpad(i::text, 12, '0'))::uuid u from generate_series(1, 50) i) s;
set local role authenticated;
select pg_temp.act_as('00000000000f');
select throws_ok($$ select public.urb_send_friend_request_by_email('a@example.com') $$, 'urb_cap_outgoing', 'the 21st outgoing request is refused');
select pg_temp.act_as('000000000010');
select throws_ok($$ select public.urb_send_friend_request_by_email('a@example.com') $$, 'urb_cap_friends', 'a 51st Friend is refused');

-- Deleting cloud data deletes the social data
select pg_temp.act_as('00000000000a');
select public.urb_send_friend_request_by_email('c@example.com');
select public.urb_delete_my_saves();
reset role;
select is((select count(*) from public.urb_profiles where user_id = '00000000-0000-0000-0001-00000000000a'), 0::bigint, 'deleting cloud data deletes the Handle');
select is((select count(*) from public.urb_friendships where '00000000-0000-0000-0001-00000000000a' in (user_low, user_high)), 0::bigint, 'and the friendships and requests');
set local role authenticated;
select pg_temp.act_as('00000000000c');
select is(jsonb_array_length(public.urb_list_social() -> 'incoming'), 0, 'the other side no longer sees the request');

select * from finish();
rollback;
