begin;
create extension if not exists pgtap with schema extensions;
select plan(22);

insert into auth.users (id, instance_id, aud, role, email, email_confirmed_at, is_anonymous, created_at, last_sign_in_at) values
  ('00000000-0000-0000-0003-00000000000a', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'a@example.com', now(), false, now(), now()),
  ('00000000-0000-0000-0003-00000000000b', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'b@example.com', now(), false, now(), now()),
  ('00000000-0000-0000-0003-00000000000c', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'c@example.com', now(), false, now(), now());
insert into public.urb_profiles (user_id, handle) values
  ('00000000-0000-0000-0003-00000000000a', 'Alice'),
  ('00000000-0000-0000-0003-00000000000b', 'Bob'),
  ('00000000-0000-0000-0003-00000000000c', 'Carol');
insert into public.urb_friendships (user_low, user_high, state, actor_id) values
  ('00000000-0000-0000-0003-00000000000a', '00000000-0000-0000-0003-00000000000b', 'accepted', '00000000-0000-0000-0003-00000000000a'),
  ('00000000-0000-0000-0003-00000000000a', '00000000-0000-0000-0003-00000000000c', 'pending', '00000000-0000-0000-0003-00000000000a');

create function pg_temp.act_as(p_user text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', ('00000000-0000-0000-0003-' || p_user)::uuid, 'role', 'authenticated')::text, true);
$$;

select ok((select relrowsecurity from pg_class where oid = 'public.urb_messages'::regclass), 'urb_messages has row level security enabled');
select is_empty(
  $$ select p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     left join pg_depend d on d.objid = p.oid and d.deptype = 'e'
     where n.nspname = 'public' and d.objid is null and p.proname not like 'urb\_%' $$,
  'every function in public is prefixed urb_'
);

set local role authenticated;
select pg_temp.act_as('00000000000a');

-- Sending
select throws_ok($$ select public.urb_send_message('00000000-0000-0000-0003-00000000000b', '   ') $$, 'urb_message_invalid', 'an empty message is refused');
select throws_ok($$ select public.urb_send_message('00000000-0000-0000-0003-00000000000b', repeat('x', 501)) $$, 'urb_message_invalid', 'a message over 500 characters is refused');
select throws_ok($$ select public.urb_send_message('00000000-0000-0000-0003-00000000000c', 'hi') $$, 'urb_not_friends', 'a pending request is not a friendship');
select lives_ok($$ select public.urb_send_message('00000000-0000-0000-0003-00000000000b', '  Hello Bob  ') $$, 'a message to a Friend is accepted');
select lives_ok($$ select public.urb_send_message('00000000-0000-0000-0003-00000000000b', repeat('y', 500)) $$, 'a message of exactly 500 characters is accepted');

-- Unread count and cursor
select pg_temp.act_as('00000000000b');
select is((public.urb_list_social() -> 'friends' -> 0 ->> 'unread')::int, 2, 'the recipient sees the unread count');
select isnt((public.urb_list_social() -> 'friends' -> 0 ->> 'lastMessageAt'), null, 'and the time of the last message');

-- Reading
select is(jsonb_array_length(public.urb_list_messages('00000000-0000-0000-0003-00000000000a')), 2, 'the Conversation lists both messages');
select is(public.urb_list_messages('00000000-0000-0000-0003-00000000000a') -> 0 ->> 'body', 'Hello Bob', 'trimmed, oldest first');
select is((public.urb_list_messages('00000000-0000-0000-0003-00000000000a') -> 0 ->> 'fromMe')::boolean, false, 'a message from the Friend is not fromMe');
select is((public.urb_list_social() -> 'friends' -> 0 ->> 'unread')::int, 0, 'reading marks the messages as read');
select is(
  jsonb_array_length(public.urb_list_messages('00000000-0000-0000-0003-00000000000a', (public.urb_list_messages('00000000-0000-0000-0003-00000000000a') -> 1 ->> 'id')::bigint)),
  0,
  'only messages after the given id are returned'
);

-- Cursor moves on send and on read
select pg_temp.act_as('00000000000a');
select is(
  (select (public.urb_list_social((public.urb_list_social() ->> 'revision')::bigint)) ->> 'changed'), 'false', 'a current cursor returns no change');
select public.urb_send_message('00000000-0000-0000-0003-00000000000b', 'again');
select pg_temp.act_as('00000000000b');
select is((public.urb_list_social() -> 'friends' -> 0 ->> 'unread')::int, 1, 'a new message raises the unread count again');

-- Isolation
select pg_temp.act_as('00000000000c');
select throws_ok($$ select count(*) from public.urb_messages $$, '42501', null, 'messages are not readable directly');
select throws_ok($$ select public.urb_list_messages('00000000-0000-0000-0003-00000000000a') $$, 'urb_not_friends', 'a non Friend cannot read a Conversation');
reset role;
set local role anon;
select throws_ok($$ select public.urb_send_message('00000000-0000-0000-0003-00000000000a', 'x') $$, '42501', null, 'anon cannot send');
reset role;

-- Rate limit: 30 per minute
insert into public.urb_messages (sender_id, recipient_id, body, created_at)
  select '00000000-0000-0000-0003-00000000000b', '00000000-0000-0000-0003-00000000000a', 'spam', now() - interval '10 seconds' from generate_series(1, 30);
set local role authenticated;
select pg_temp.act_as('00000000000b');
select throws_ok($$ select public.urb_send_message('00000000-0000-0000-0003-00000000000a', 'one more') $$, 'urb_rate_limited', 'the 31st message within a minute is refused');

-- Purge after 30 days, and the Conversation ends with the Friendship
reset role;
update public.urb_messages set created_at = now() - interval '31 days' where body = 'Hello Bob';
select public.urb_purge_old_messages();
select is((select count(*) from public.urb_messages where body = 'Hello Bob'), 0::bigint, 'messages older than 30 days are purged');
set local role authenticated;
select pg_temp.act_as('00000000000b');
select public.urb_block_user('00000000-0000-0000-0003-00000000000a');
reset role;
select is((select count(*) from public.urb_messages), 0::bigint, 'blocking deletes the Conversation');

select * from finish();
rollback;
