begin;
create extension if not exists pgtap with schema extensions;
select plan(12);

insert into auth.users (id, instance_id, aud, role, email, is_anonymous, created_at, last_sign_in_at) values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', null, true, now(), now()),
  ('00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', null, true, now(), now());

create function pg_temp.act_as(p_user uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated')::text, true);
$$;

select ok(
  (select relrowsecurity from pg_class where oid = 'public.urb_city_leases'::regclass),
  'urb_city_leases has row level security enabled'
);

set local role authenticated;
select pg_temp.act_as('00000000-0000-0000-0000-0000000000a1');

select is((select held from public.urb_claim_city('00000000-0000-0000-0000-000000000001', 'phone')), true, 'the first device takes the lease');
select is((select held from public.urb_claim_city('00000000-0000-0000-0000-000000000001', 'phone')), true, 'the same device renews its lease');
select is((select held from public.urb_claim_city('00000000-0000-0000-0000-000000000001', 'laptop')), false, 'another device is refused while the lease lives');
select is((select holder from public.urb_claim_city('00000000-0000-0000-0000-000000000001', 'laptop')), 'phone', 'the refusal names the holder');
select is((select held from public.urb_claim_city('00000000-0000-0000-0000-000000000002', 'laptop')), true, 'each City has its own lease');

select throws_ok(
  $$ select public.urb_push_save('00000000-0000-0000-0000-000000000001', 0, '{"city":"x"}'::jsonb, 11, now(), false, 'laptop') $$,
  'urb_not_active',
  'a push from a device that does not hold the lease is refused'
);
select is(public.urb_push_save('00000000-0000-0000-0000-000000000001', 0, '{"city":"x"}'::jsonb, 11, now(), false, 'phone'), 1::bigint, 'the Active device pushes');

select is((select held from public.urb_claim_city('00000000-0000-0000-0000-000000000001', 'laptop', true)), true, 'a Takeover is always granted');
select throws_ok(
  $$ select public.urb_push_save('00000000-0000-0000-0000-000000000001', 1, '{"city":"y"}'::jsonb, 11, now(), false, 'phone') $$,
  'urb_not_active',
  'the device that lost the lease can no longer push'
);

reset role;
update public.urb_city_leases set expires_at = now() - interval '1 second';
set local role authenticated;
select pg_temp.act_as('00000000-0000-0000-0000-0000000000a1');
select is((select held from public.urb_claim_city('00000000-0000-0000-0000-000000000001', 'phone')), true, 'a lapsed lease is taken without a Takeover');

select pg_temp.act_as('00000000-0000-0000-0000-0000000000a2');
select is((select held from public.urb_claim_city('00000000-0000-0000-0000-000000000001', 'tablet')), true, 'another account never sees the lease of this one');

select * from finish();
rollback;
