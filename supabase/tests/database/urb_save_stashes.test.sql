begin;
create extension if not exists pgtap with schema extensions;
select plan(12);

insert into auth.users (id, instance_id, aud, role, email, is_anonymous, created_at, last_sign_in_at) values
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', null, true, now(), now()),
  ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', null, true, now(), now());

create function pg_temp.act_as(p_user uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated')::text, true);
$$;

select ok(
  (select relrowsecurity from pg_class where oid = 'public.urb_save_stashes'::regclass),
  'urb_save_stashes has row level security enabled'
);

set local role authenticated;
select pg_temp.act_as('00000000-0000-0000-0000-0000000000b1');

select is(public.urb_push_save('00000000-0000-0000-0000-000000000001', 0, '{"city":"current"}'::jsonb, 11, now(), false, 'phone'), 1::bigint, 'the Active device pushes');
select is(public.urb_claim_city('00000000-0000-0000-0000-000000000001', 'laptop', true) is not null, true, 'another device takes the City over');

select cmp_ok(public.urb_stash_save('00000000-0000-0000-0000-000000000001', '{"city":"aside-1"}'::jsonb, 11, '2026-01-01 10:00:00+00'), '<', 0::bigint, 'a device without the lease sets its work aside');
select is((select envelope->>'city' from public.urb_saves where city_id = '00000000-0000-0000-0000-000000000001'), 'current', 'the stash never replaces the current save');
select is((select max(revision) from public.urb_saves), 1::bigint, 'the current revision does not move');

select is(
  public.urb_stash_save('00000000-0000-0000-0000-000000000001', '{"city":"aside-1"}'::jsonb, 11, '2026-01-01 10:00:00+00'),
  (select revision from public.urb_list_saves('00000000-0000-0000-0000-000000000001') where revision < 0),
  'setting the same work aside twice keeps one stash'
);

select public.urb_stash_save('00000000-0000-0000-0000-000000000001', '{"city":"aside-2"}'::jsonb, 11, '2026-01-01 10:01:00+00');
select public.urb_stash_save('00000000-0000-0000-0000-000000000001', '{"city":"aside-3"}'::jsonb, 11, '2026-01-01 10:02:00+00');
select public.urb_stash_save('00000000-0000-0000-0000-000000000001', '{"city":"aside-4"}'::jsonb, 11, '2026-01-01 10:03:00+00');
select is((select count(*) from public.urb_list_saves('00000000-0000-0000-0000-000000000001') where revision < 0), 3::bigint, 'three stashes are kept per City');

select is((select revision from public.urb_list_saves('00000000-0000-0000-0000-000000000001') limit 1), 1::bigint, 'the current save comes first in the version list');

select cmp_ok(
  public.urb_restore_save('00000000-0000-0000-0000-000000000001', (select revision from public.urb_list_saves('00000000-0000-0000-0000-000000000001') where revision < 0 order by revision asc limit 1)),
  '=', 2::bigint, 'restoring a stash makes it the new current save'
);
select is((select envelope->>'city' from public.urb_saves where city_id = '00000000-0000-0000-0000-000000000001' order by revision desc limit 1), 'aside-4', 'the newest stash is the one restored');

select pg_temp.act_as('00000000-0000-0000-0000-0000000000b2');
select is((select count(*) from public.urb_list_saves('00000000-0000-0000-0000-000000000001')), 0::bigint, 'another account sees none of it');

select * from finish();
rollback;
