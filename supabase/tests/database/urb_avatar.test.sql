begin;
create extension if not exists pgtap with schema extensions;
select plan(7);

insert into auth.users (id, instance_id, aud, role, email, email_confirmed_at, is_anonymous, created_at, last_sign_in_at) values
  ('00000000-0000-0000-0002-00000000000a', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'a@example.com', now(), false, now(), now()),
  ('00000000-0000-0000-0002-00000000000b', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'b@example.com', now(), false, now(), now());

create function pg_temp.act_as(p_user text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', ('00000000-0000-0000-0002-' || p_user)::uuid, 'role', 'authenticated')::text, true);
$$;

set local role authenticated;
select pg_temp.act_as('00000000000a');
select public.urb_set_handle('Alice');
select pg_temp.act_as('00000000000b');
select public.urb_set_handle('Bob');
select pg_temp.act_as('00000000000a');
select public.urb_send_friend_request_by_email('b@example.com');
select pg_temp.act_as('00000000000b');
select public.urb_accept_friend_request('00000000-0000-0000-0002-00000000000a');
create temp table before_revision as select (public.urb_list_social() ->> 'revision')::bigint as revision;
grant select on before_revision to authenticated;

select pg_temp.act_as('00000000000a');
select is(public.urb_list_social() -> 'avatar', 'null'::jsonb, 'a new account has no Avatar');
select throws_ok($$ select public.urb_set_avatar('character-unknown') $$, 'urb_avatar_invalid', 'an unknown Avatar is refused');
select lives_ok($$ select public.urb_set_avatar('character-female-c') $$, 'a known Avatar is accepted');
select is(public.urb_list_social() ->> 'avatar', 'character-female-c', 'the Avatar is listed');

select pg_temp.act_as('00000000000b');
select is(public.urb_list_social() -> 'friends' -> 0 ->> 'avatar', 'character-female-c', 'a Friend sees the Avatar');
select cmp_ok((public.urb_list_social() ->> 'revision')::bigint, '>', (select revision from before_revision), 'changing the Avatar makes Friends refresh');

select pg_temp.act_as('00000000000a');
select lives_ok($$ select public.urb_set_avatar(null) $$, 'the Avatar can be cleared');

select * from finish();
rollback;
