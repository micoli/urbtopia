begin;
create extension if not exists pgtap with schema extensions;
select plan(34);

-- Anonymous accounts: no email, no Handle
insert into auth.users (id, instance_id, aud, role, email, is_anonymous, created_at, last_sign_in_at) values
  ('00000000-0000-0000-0007-00000000000a', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', null, true, now(), now()),
  ('00000000-0000-0000-0007-00000000000b', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', null, true, now(), now());

create function pg_temp.act_as(p_user text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', ('00000000-0000-0000-0007-' || p_user)::uuid, 'role', 'authenticated')::text, true);
$$;
create function pg_temp.lot(p_item text default 'wood', p_quantity int default 5) returns jsonb language sql as $$
  select jsonb_build_array(jsonb_build_object('item', p_item, 'quantity', p_quantity));
$$;
create function pg_temp.ship(n int) returns uuid language sql as $$
  select ('00000000-0000-0000-0008-' || lpad(n::text, 12, '0'))::uuid;
$$;
create function pg_temp.city(n int) returns uuid language sql as $$
  select ('00000000-0000-0000-0009-' || lpad(n::text, 12, '0'))::uuid;
$$;

select ok((select relrowsecurity from pg_class where oid = 'public.urb_shipments'::regclass), 'urb_shipments has row level security enabled');
select ok(exists (select 1 from cron.job where jobname = 'urb_purge_settled_shipments'), 'settled Shipments are purged by a cron job');

set local role authenticated;
select pg_temp.act_as('00000000000a');
-- Cloud saves make the Cities known to the account
select public.urb_push_save(pg_temp.city(1), 0, '{"c":1}'::jsonb, 11, now());
select public.urb_push_save(pg_temp.city(2), 0, '{"c":2}'::jsonb, 11, now());
select public.urb_push_save(pg_temp.city(3), 0, '{"c":3}'::jsonb, 11, now());

-- Creating
select lives_ok($$ select public.urb_create_shipment(pg_temp.ship(1), pg_temp.city(1), pg_temp.city(2), pg_temp.lot()) $$, 'an anonymous account sends a Shipment between two of its Cities');
select lives_ok($$ select public.urb_create_shipment(pg_temp.ship(1), pg_temp.city(1), pg_temp.city(2), pg_temp.lot()) $$, 'creating it again is a no-op');
select throws_ok($$ select public.urb_create_shipment(pg_temp.ship(1), pg_temp.city(1), pg_temp.city(2), pg_temp.lot('stone')) $$, 'urb_shipment_conflict', 'the same id with another Lot is a conflict');
select throws_ok($$ select public.urb_create_shipment(pg_temp.ship(1), pg_temp.city(1), pg_temp.city(3), pg_temp.lot()) $$, 'urb_shipment_conflict', 'the same id with another destination is a conflict');
select throws_ok($$ select public.urb_create_shipment(pg_temp.ship(2), pg_temp.city(1), pg_temp.city(1), pg_temp.lot()) $$, 'urb_shipment_invalid', 'the destination must differ from the sender');
select throws_ok($$ select public.urb_create_shipment(pg_temp.ship(2), pg_temp.city(1), pg_temp.city(2), '[]') $$, 'urb_shipment_invalid', 'an empty Lot is refused');
select throws_ok($$ select public.urb_create_shipment(pg_temp.ship(2), pg_temp.city(1), pg_temp.city(2), '[{"item":"wood","quantity":0}]') $$, 'urb_shipment_invalid', 'a zero quantity is refused');
select throws_ok($$ select public.urb_create_shipment(pg_temp.ship(2), pg_temp.city(1), pg_temp.city(99), pg_temp.lot()) $$, 'urb_city_unknown', 'a destination the account never saved is refused');
select throws_ok($$ select public.urb_create_shipment(pg_temp.ship(2), pg_temp.city(98), pg_temp.city(2), pg_temp.lot()) $$, 'urb_city_unknown', 'so is an unknown sender');

-- Listing
select is(jsonb_array_length(public.urb_list_shipments()), 1, 'the waiting Shipment is listed');
select is(public.urb_list_shipments() -> 0 ->> 'state', 'waiting', 'it is waiting');
select is((public.urb_list_shipments() -> 0 ->> 'toCityId')::uuid, pg_temp.city(2), 'it names its destination');

-- Claiming
select pg_temp.act_as('00000000000b');
select throws_ok($$ select public.urb_claim_shipment(pg_temp.ship(1), pg_temp.city(2)) $$, 'urb_shipment_unavailable', 'another account cannot claim it');
select is(jsonb_array_length(public.urb_list_shipments()), 0, 'nor see it');
select pg_temp.act_as('00000000000a');
select throws_ok($$ select public.urb_claim_shipment(pg_temp.ship(1), pg_temp.city(3)) $$, 'urb_shipment_unavailable', 'a City other than the destination cannot claim it');
select throws_ok($$ select public.urb_claim_shipment(pg_temp.ship(1), pg_temp.city(1)) $$, 'urb_shipment_unavailable', 'the sending City cannot claim it either');
select is(public.urb_claim_shipment(pg_temp.ship(1), pg_temp.city(2)) ->> 'effect', 'receive-lot', 'the destination City claims the Lot');
select is((public.urb_claim_shipment(pg_temp.ship(1), pg_temp.city(2)) ->> 'alreadyClaimed')::boolean, true, 'claiming again answers already claimed');
select throws_ok($$ select public.urb_cancel_shipment(pg_temp.ship(1), pg_temp.city(1)) $$, 'urb_shipment_unavailable', 'a claimed Shipment cannot be cancelled');

-- Cancelling
select public.urb_create_shipment(pg_temp.ship(3), pg_temp.city(1), pg_temp.city(2), pg_temp.lot('planks', 2));
select throws_ok($$ select public.urb_cancel_shipment(pg_temp.ship(3), pg_temp.city(2)) $$, 'urb_shipment_unavailable', 'only the sending City cancels');
select is(public.urb_cancel_shipment(pg_temp.ship(3), pg_temp.city(1)) ->> 'effect', 'return-lot', 'the sending City takes the Lot back');
select is((public.urb_cancel_shipment(pg_temp.ship(3), pg_temp.city(1)) ->> 'alreadyCancelled')::boolean, true, 'cancelling again answers already cancelled');
select throws_ok($$ select public.urb_claim_shipment(pg_temp.ship(3), pg_temp.city(2)) $$, 'urb_shipment_unavailable', 'a cancelled Shipment cannot be claimed');

-- Limits: 5 waiting per sending City
do $$
begin
  for i in 10..14 loop
    perform public.urb_create_shipment(pg_temp.ship(i), pg_temp.city(1), pg_temp.city(2), pg_temp.lot());
  end loop;
end $$;
select throws_ok($$ select public.urb_create_shipment(pg_temp.ship(20), pg_temp.city(1), pg_temp.city(3), pg_temp.lot()) $$, 'urb_cap_shipments_waiting', 'a sixth waiting Shipment from one City is refused');
select lives_ok($$ select public.urb_create_shipment(pg_temp.ship(15), pg_temp.city(2), pg_temp.city(3), pg_temp.lot()) $$, 'another sending City has its own allowance');
select public.urb_cancel_shipment(pg_temp.ship(10), pg_temp.city(1));
select lives_ok($$ select public.urb_create_shipment(pg_temp.ship(16), pg_temp.city(1), pg_temp.city(3), pg_temp.lot()) $$, 'cancelling frees a slot');

-- Limits: 30 per account per day
reset role;
insert into public.urb_shipments (id, user_id, from_city_id, to_city_id, lot, state)
  select pg_temp.ship(100 + g), '00000000-0000-0000-0007-00000000000a', pg_temp.city(3), pg_temp.city(2), pg_temp.lot(), 'claimed' from generate_series(1, 30) g;
set local role authenticated;
select pg_temp.act_as('00000000000a');
select throws_ok($$ select public.urb_create_shipment(pg_temp.ship(200), pg_temp.city(3), pg_temp.city(1), pg_temp.lot()) $$, 'urb_rate_limited', 'the 31st Shipment within a day is refused');

-- A City with a waiting Shipment keeps its Cloud save
select throws_ok($$ select public.urb_delete_city_saves(pg_temp.city(1)) $$, 'urb_city_has_shipments', 'the sending City of a waiting Shipment cannot be deleted');
select throws_ok($$ select public.urb_delete_city_saves(pg_temp.city(3)) $$, 'urb_city_has_shipments', 'nor the destination City');

-- Direct access and purge
select throws_ok($$ select count(*) from public.urb_shipments $$, '42501', null, 'the table cannot be read directly');
reset role;
update public.urb_shipments set updated_at = now() - interval '8 days' where state = 'claimed';
select public.urb_purge_settled_shipments();
select is((select count(*) from public.urb_shipments where state = 'claimed'), 0::bigint, 'settled Shipments are purged after a week');
select ok((select count(*) from public.urb_shipments where state = 'waiting') > 0, 'waiting ones are kept for good');

select * from finish();
rollback;
