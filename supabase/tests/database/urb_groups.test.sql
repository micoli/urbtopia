begin;
create extension if not exists pgtap with schema extensions;
select plan(46);

-- a creator; b, c, d Friends of a (b and c are not Friends of each other); e stranger; g Friend of a, spare for the member cap.
insert into auth.users (id, instance_id, aud, role, email, email_confirmed_at, is_anonymous, created_at, last_sign_in_at)
  select ('00000000-0000-0000-0004-00000000000' || n)::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', n || '@example.com', now(), false, now(), now()
  from unnest(array['a', 'b', 'c', 'd', 'e', 'f']) n;
insert into public.urb_profiles (user_id, handle) values
  ('00000000-0000-0000-0004-00000000000a', 'Alice'),
  ('00000000-0000-0000-0004-00000000000b', 'Bob'),
  ('00000000-0000-0000-0004-00000000000c', 'Carol'),
  ('00000000-0000-0000-0004-00000000000d', 'Dave'),
  ('00000000-0000-0000-0004-00000000000e', 'Erin'),
  ('00000000-0000-0000-0004-00000000000f', 'Frank');
insert into public.urb_friendships (user_low, user_high, state, actor_id) values
  ('00000000-0000-0000-0004-00000000000a', '00000000-0000-0000-0004-00000000000b', 'accepted', '00000000-0000-0000-0004-00000000000a'),
  ('00000000-0000-0000-0004-00000000000a', '00000000-0000-0000-0004-00000000000c', 'accepted', '00000000-0000-0000-0004-00000000000a'),
  ('00000000-0000-0000-0004-00000000000a', '00000000-0000-0000-0004-00000000000d', 'accepted', '00000000-0000-0000-0004-00000000000a'),
  ('00000000-0000-0000-0004-00000000000a', '00000000-0000-0000-0004-00000000000f', 'accepted', '00000000-0000-0000-0004-00000000000a');

create function pg_temp.act_as(p_user text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', ('00000000-0000-0000-0004-' || p_user)::uuid, 'role', 'authenticated')::text, true);
$$;

select is_empty(
  $$ select relname from pg_class where relname in ('urb_groups', 'urb_group_members', 'urb_group_messages') and not relrowsecurity $$,
  'the Group tables have row level security enabled'
);

set local role authenticated;
select pg_temp.act_as('00000000000a');

-- Creating
select throws_ok($$ select public.urb_create_group('ab', array[]::uuid[]) $$, 'urb_group_name_invalid', 'a name under 3 characters is refused');
select throws_ok($$ select public.urb_create_group(repeat('x', 31), array[]::uuid[]) $$, 'urb_group_name_invalid', 'a name over 30 characters is refused');
select throws_ok($$ select public.urb_create_group('My Admin Club', array[]::uuid[]) $$, 'urb_group_name_forbidden', 'a forbidden word is refused');
select throws_ok($$ select public.urb_create_group('Crew', array['00000000-0000-0000-0004-00000000000e']::uuid[]) $$, 'urb_not_friends', 'only Friends of the creator can be added');
select set_config('urbtest.group', public.urb_create_group('  Builders ', array['00000000-0000-0000-0004-00000000000b', '00000000-0000-0000-0004-00000000000c']::uuid[])::text, true);
select is(public.urb_list_groups() -> 'groups' -> 0 ->> 'name', 'Builders', 'the name is trimmed');
select is(jsonb_array_length(public.urb_list_groups() -> 'groups' -> 0 -> 'members'), 3, 'the creator and the two Friends are members');
select is(public.urb_list_groups() -> 'groups' -> 0 -> 'members' -> 0 ->> 'handle', 'Alice', 'members are listed by Handle');

-- Creator-only operations
select throws_ok($$ select public.urb_leave_group(current_setting('urbtest.group')::uuid) $$, 'urb_group_creator_cannot_leave', 'the creator cannot leave without deleting');
select pg_temp.act_as('00000000000b');
select throws_ok($$ select public.urb_rename_group(current_setting('urbtest.group')::uuid, 'Hijack') $$, 'urb_not_creator', 'a member cannot rename');
select throws_ok($$ select public.urb_add_group_members(current_setting('urbtest.group')::uuid, array['00000000-0000-0000-0004-00000000000d']::uuid[]) $$, 'urb_not_creator', 'a member cannot add');
select throws_ok($$ select public.urb_delete_group(current_setting('urbtest.group')::uuid) $$, 'urb_not_creator', 'a member cannot delete');
select pg_temp.act_as('00000000000d');
select throws_ok($$ select public.urb_list_group_messages(current_setting('urbtest.group')::uuid) $$, 'urb_not_found', 'a non-member cannot read');
select throws_ok($$ select public.urb_send_group_message(current_setting('urbtest.group')::uuid, 'hi') $$, 'urb_not_found', 'a non-member cannot post');

-- Messages
select pg_temp.act_as('00000000000b');
select throws_ok($$ select public.urb_send_group_message(current_setting('urbtest.group')::uuid, '   ') $$, 'urb_message_invalid', 'an empty message is refused');
select throws_ok($$ select public.urb_send_group_message(current_setting('urbtest.group')::uuid, repeat('x', 501)) $$, 'urb_message_invalid', 'a message over 500 characters is refused');
select lives_ok($$ select public.urb_send_group_message(current_setting('urbtest.group')::uuid, ' Hello team ') $$, 'a member can post');
select pg_temp.act_as('00000000000a');
select is((public.urb_list_groups() -> 'groups' -> 0 ->> 'unread')::int, 1, 'the others see it as unread');
select is(public.urb_list_groups() -> 'groups' -> 0 ->> 'lastMessagePreview', 'Hello team', 'with a trimmed preview');
select is(public.urb_list_group_messages(current_setting('urbtest.group')::uuid) -> 0 ->> 'senderHandle', 'Bob', 'reading shows the author');
select is((public.urb_list_groups() -> 'groups' -> 0 ->> 'unread')::int, 0, 'reading clears the unread count');
select is((public.urb_list_groups((public.urb_list_groups() ->> 'revision')::bigint)) ->> 'changed', 'false', 'a current cursor returns no change');

-- Adding, renaming, removing
select lives_ok($$ select public.urb_add_group_members(current_setting('urbtest.group')::uuid, array['00000000-0000-0000-0004-00000000000d']::uuid[]) $$, 'the creator adds a Friend');
select is(jsonb_array_length(public.urb_list_groups() -> 'groups' -> 0 -> 'members'), 4, 'who is a member at once');
select throws_ok($$ select public.urb_add_group_members(current_setting('urbtest.group')::uuid, array['00000000-0000-0000-0004-00000000000e']::uuid[]) $$, 'urb_not_friends', 'a stranger cannot be added');
select lives_ok($$ select public.urb_rename_group(current_setting('urbtest.group')::uuid, 'Builders United') $$, 'the creator renames');
select pg_temp.act_as('00000000000d');
select is(public.urb_list_groups() -> 'groups' -> 0 ->> 'name', 'Builders United', 'members see the new name');
select lives_ok($$ select public.urb_leave_group(current_setting('urbtest.group')::uuid) $$, 'a member leaves');
select is(jsonb_array_length(public.urb_list_groups() -> 'groups'), 0, 'and no longer sees the Group');
select pg_temp.act_as('00000000000a');
select throws_ok($$ select public.urb_remove_group_member(current_setting('urbtest.group')::uuid, '00000000-0000-0000-0004-00000000000a') $$, 'urb_not_found', 'the creator cannot be removed');
select lives_ok($$ select public.urb_remove_group_member(current_setting('urbtest.group')::uuid, '00000000-0000-0000-0004-00000000000c') $$, 'the creator removes a member');

-- Hiding a blocked author: Bob and Carol are not Friends; Carol is back as a member
select public.urb_add_group_members(current_setting('urbtest.group')::uuid, array['00000000-0000-0000-0004-00000000000c']::uuid[]);
select pg_temp.act_as('00000000000c');
select public.urb_send_group_message(current_setting('urbtest.group')::uuid, 'from Carol');
select pg_temp.act_as('00000000000b');
select public.urb_block_user('00000000-0000-0000-0004-00000000000c');
select is(jsonb_array_length(public.urb_list_group_messages(current_setting('urbtest.group')::uuid)), 1, 'a blocked author is hidden from the blocker');
select pg_temp.act_as('00000000000a');
select is(jsonb_array_length(public.urb_list_group_messages(current_setting('urbtest.group')::uuid)), 2, 'and still visible to everyone else');

-- Leaving the Friendship leaves the Group
select pg_temp.act_as('00000000000a');
select public.urb_remove_friend('00000000-0000-0000-0004-00000000000c');
reset role;
select is((select count(*) from public.urb_group_members where user_id = '00000000-0000-0000-0004-00000000000c'), 0::bigint, 'a member who stops being a Friend of the creator is removed');
set local role authenticated;
select pg_temp.act_as('00000000000a');
select public.urb_block_user('00000000-0000-0000-0004-00000000000b');
reset role;
select is((select count(*) from public.urb_group_members where user_id = '00000000-0000-0000-0004-00000000000b'), 0::bigint, 'blocking a member removes them too');

-- Deleting
set local role authenticated;
select pg_temp.act_as('00000000000a');
select lives_ok($$ select public.urb_delete_group(current_setting('urbtest.group')::uuid) $$, 'the creator deletes the Group');
reset role;
select is((select count(*) from public.urb_group_messages), 0::bigint, 'with its messages');

-- Caps
set local role authenticated;
select pg_temp.act_as('00000000000a');
select public.urb_create_group('Group ' || i, array[]::uuid[]) from generate_series(1, 5) i;
select throws_ok($$ select public.urb_create_group('One too many', array[]::uuid[]) $$, 'urb_cap_groups_created', 'a player creates at most 5 Groups');

reset role;
insert into auth.users (id, instance_id, aud, role, email, email_confirmed_at, is_anonymous, created_at, last_sign_in_at)
  select ('00000000-0000-0000-0005-' || lpad(i::text, 12, '0'))::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'filler' || i || '@example.com', now(), false, now(), now()
  from generate_series(1, 8) i;
insert into public.urb_profiles (user_id, handle)
  select ('00000000-0000-0000-0005-' || lpad(i::text, 12, '0'))::uuid, 'Filler' || i from generate_series(1, 8) i;
select set_config('urbtest.g1', (select id::text from public.urb_groups where name = 'Group 1'), true), set_config('urbtest.g2', (select id::text from public.urb_groups where name = 'Group 2'), true);
insert into public.urb_group_members (group_id, user_id)
  select current_setting('urbtest.g1')::uuid, ('00000000-0000-0000-0005-' || lpad(i::text, 12, '0'))::uuid from generate_series(1, 8) i;
set local role authenticated;
select pg_temp.act_as('00000000000a');
select lives_ok($$ select public.urb_add_group_members(current_setting('urbtest.g1')::uuid, array['00000000-0000-0000-0004-00000000000f']::uuid[]) $$, 'the tenth member fits');
select throws_ok($$ select public.urb_add_group_members(current_setting('urbtest.g1')::uuid, array['00000000-0000-0000-0004-00000000000d']::uuid[]) $$, 'urb_group_full', 'an eleventh member does not');

reset role;
insert into public.urb_groups (creator_id, name)
  select '00000000-0000-0000-0004-00000000000e', 'Other ' || i from generate_series(1, 10) i;
insert into public.urb_group_members (group_id, user_id)
  select id, '00000000-0000-0000-0004-00000000000d' from public.urb_groups where name like 'Other %';
set local role authenticated;
select pg_temp.act_as('00000000000a');
select throws_ok($$ select public.urb_add_group_members(current_setting('urbtest.g2')::uuid, array['00000000-0000-0000-0004-00000000000d']::uuid[]) $$, 'urb_cap_groups_joined', 'a player joins at most 10 Groups created by others');

-- The daily sending cap is shared with Messages
reset role;
insert into public.urb_messages (sender_id, recipient_id, body, created_at)
  select '00000000-0000-0000-0004-00000000000a', '00000000-0000-0000-0004-00000000000f', 'spam', now() - interval '2 hours' from generate_series(1, 499);
set local role authenticated;
select pg_temp.act_as('00000000000a');
select lives_ok($$ select public.urb_send_group_message(current_setting('urbtest.g1')::uuid, 'the 500th') $$, 'the 500th message of the day is accepted');
select throws_ok($$ select public.urb_send_group_message(current_setting('urbtest.g1')::uuid, 'the 501st') $$, 'urb_rate_limited', 'the 501st Group message is refused');
select throws_ok($$ select public.urb_send_message('00000000-0000-0000-0004-00000000000f', 'the 501st') $$, 'urb_rate_limited', 'and so is a Message');

-- Purge
reset role;
update public.urb_group_messages set created_at = now() - interval '31 days';
select public.urb_purge_old_messages();
select is((select count(*) from public.urb_group_messages), 0::bigint, 'Group messages older than 30 days are purged');

-- Deleting cloud data ends the Groups the player created
set local role authenticated;
select pg_temp.act_as('00000000000a');
select public.urb_delete_my_saves();
reset role;
select is((select count(*) from public.urb_groups where creator_id = '00000000-0000-0000-0004-00000000000a'), 0::bigint, 'deleting cloud data ends the Groups the player created');

select * from finish();
rollback;
