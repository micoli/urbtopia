begin;
create extension if not exists pgtap with schema extensions;
select plan(32);

insert into auth.users (id, instance_id, aud, role, email, is_anonymous, created_at, last_sign_in_at) values
  ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', null, true, now(), now()),
  ('00000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', null, true, now(), now()),
  ('00000000-0000-0000-0000-00000000000c', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', null, true, now() - interval '200 days', now() - interval '200 days'),
  ('00000000-0000-0000-0000-00000000000d', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'kept@example.com', false, now() - interval '200 days', now() - interval '200 days');

create function pg_temp.act_as(p_user uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated')::text, true);
$$;

-- Structure
select ok(
  (select relrowsecurity from pg_class where oid = 'public.urb_saves'::regclass),
  'urb_saves has row level security enabled'
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

-- User A pushes, first save
set local role authenticated;
select pg_temp.act_as('00000000-0000-0000-0000-00000000000a');
select is(public.urb_push_save('00000000-0000-0000-0000-000000000001', 0, '{"city":"a1"}'::jsonb, 11, now()), 1::bigint, 'first push creates revision 1');
select is(public.urb_push_save('00000000-0000-0000-0000-000000000001', 1, '{"city":"a2"}'::jsonb, 11, now()), 2::bigint, 'second push within the hour reuses the row and bumps the revision');
select is((select count(*) from public.urb_saves), 1::bigint, 'history rotates at most once an hour');

-- Compare-and-swap conflict
select is(public.urb_push_save('00000000-0000-0000-0000-000000000001', 2, '{"city":"kept"}'::jsonb, 11, now(), true), 3::bigint, 'keep_previous forces a new row inside the hour');
select is((select count(*) from public.urb_saves), 2::bigint, 'the previous version is kept');
select throws_ok(
  $$ select public.urb_push_save('00000000-0000-0000-0000-000000000001', 1, '{"city":"stale"}'::jsonb, 11, now()) $$,
  'urb_conflict',
  'a stale base revision is refused as a conflict'
);

-- Oversize
select throws_ok(
  $$ select public.urb_push_save('00000000-0000-0000-0000-000000000001', 3, to_jsonb(repeat('x', 1100000)), 11, now()) $$,
  'urb_too_large',
  'an envelope over 1 MB is refused'
);

-- Direct writes refused
select throws_ok(
  $$ insert into public.urb_saves (user_id, city_id, revision, format_version, envelope, client_saved_at)
     values ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-000000000001', 99, 11, '{}', now()) $$,
  '42501',
  null,
  'direct insert is refused'
);
select throws_ok($$ update public.urb_saves set envelope = '{}' $$, '42501', null, 'direct update is refused');
select throws_ok($$ delete from public.urb_saves $$, '42501', null, 'direct delete is refused');

-- Never more than 10 rows: age the rows so each push rotates
do $$
begin
  for i in 3..12 loop
    reset role;
    update public.urb_saves set created_at = created_at - interval '2 hours';
    set local role authenticated;
    perform pg_temp.act_as('00000000-0000-0000-0000-00000000000a');
    perform public.urb_push_save('00000000-0000-0000-0000-000000000001', i, jsonb_build_object('city', 'a' || i), 11, now());
  end loop;
end $$;
select is((select count(*) from public.urb_saves), 10::bigint, 'the 11th row is never kept');

-- Restore makes an old version current again
select is((select count(*) from public.urb_list_saves('00000000-0000-0000-0000-000000000001')), 10::bigint, 'urb_list_saves lists the caller rows');
select is(
  public.urb_restore_save('00000000-0000-0000-0000-000000000001', (select min(revision) from public.urb_saves)) > 12,
  true,
  'urb_restore_save creates a new current revision'
);

-- Isolation between users
select pg_temp.act_as('00000000-0000-0000-0000-00000000000b');
select is((select count(*) from public.urb_saves), 0::bigint, 'user B cannot read user A rows');

-- Cities: each has its own revision history, rotation and conflicts
set local role authenticated;
select pg_temp.act_as('00000000-0000-0000-0000-00000000000b');
select is(public.urb_push_save('00000000-0000-0000-0000-0000000000c1', 0, '{"city":"b1"}'::jsonb, 11, now()), 1::bigint, 'a second City starts at revision 1');
select is(public.urb_push_save('00000000-0000-0000-0000-0000000000c2', 0, '{"city":"b2"}'::jsonb, 11, now()), 1::bigint, 'a third City starts at revision 1');
select throws_ok(
  $$ select public.urb_push_save('00000000-0000-0000-0000-0000000000c1', 0, '{"city":"stale"}'::jsonb, 11, now()) $$,
  'urb_conflict',
  'a conflict on one City is judged against that City only'
);
select is(public.urb_push_save('00000000-0000-0000-0000-0000000000c1', 1, '{"city":"b1b"}'::jsonb, 11, now()), 2::bigint, 'pushing one City does not move the revision of another');
select is(public.urb_push_save('00000000-0000-0000-0000-0000000000c3', 0, '{"city":"b3"}'::jsonb, 11, now()), 1::bigint, 'the third City still fits');
select throws_ok(
  $$ select public.urb_push_save('00000000-0000-0000-0000-0000000000c4', 0, '{"city":"b4"}'::jsonb, 11, now()) $$,
  'urb_city_limit',
  'a fourth City is refused'
);
select is(public.urb_push_save('00000000-0000-0000-0000-0000000000c3', 1, '{"city":"b3b"}'::jsonb, 11, now()), 2::bigint, 'an existing City can still be pushed at the limit');
select is((select count(*) from public.urb_list_cities()), 3::bigint, 'urb_list_cities lists one row per City');
select is(
  (select revision from public.urb_list_cities() where city_id = '00000000-0000-0000-0000-0000000000c1'),
  2::bigint,
  'urb_list_cities reports the latest revision of each City'
);
select is((select count(*) from public.urb_list_saves('00000000-0000-0000-0000-0000000000c2')), 1::bigint, 'urb_list_saves lists one City only');
select throws_ok(
  $$ select public.urb_restore_save('00000000-0000-0000-0000-0000000000c2', 99) $$,
  'urb_not_found',
  'a revision of another City cannot be restored'
);
select public.urb_delete_city_saves('00000000-0000-0000-0000-0000000000c1');
select is(
  (select count(*) from public.urb_list_cities()),
  2::bigint,
  'urb_delete_city_saves removes that City only'
);
select is(public.urb_push_save('00000000-0000-0000-0000-0000000000c4', 0, '{"city":"b4"}'::jsonb, 11, now()), 1::bigint, 'deleting a City frees a slot');

-- No JWT reads nothing
reset role;
set local role anon;
select throws_ok($$ select count(*) from public.urb_saves $$, '42501', null, 'anon role has no access to the table');

-- Purge skips email accounts and recent users, removes stale anonymous users
reset role;
select public.urb_purge_inactive_anonymous_users();
select results_eq(
  $$ select id::text from auth.users where id in (
       '00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000b',
       '00000000-0000-0000-0000-00000000000c', '00000000-0000-0000-0000-00000000000d') order by id::text $$,
  $$ values ('00000000-0000-0000-0000-00000000000a'), ('00000000-0000-0000-0000-00000000000b'), ('00000000-0000-0000-0000-00000000000d') $$,
  'purge removes the stale anonymous user and keeps recent and email accounts'
);

select * from finish();
rollback;
