begin;
create extension if not exists pgtap with schema extensions;
select plan(53);

insert into auth.users (id, instance_id, aud, role, email, email_confirmed_at, is_anonymous, created_at, last_sign_in_at)
  select ('00000000-0000-0000-0004-0000000000' || n)::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', n || '@example.com', now(), false, now(), now()
  from unnest(array['0a', '0b', '0c', '0d']) n;
insert into public.urb_profiles (user_id, handle) values
  ('00000000-0000-0000-0004-00000000000a', 'Alice'),
  ('00000000-0000-0000-0004-00000000000b', 'Bob'),
  ('00000000-0000-0000-0004-00000000000c', 'Carol'),
  ('00000000-0000-0000-0004-00000000000d', 'Dave');
insert into public.urb_friendships (user_low, user_high, state, actor_id) values
  ('00000000-0000-0000-0004-00000000000a', '00000000-0000-0000-0004-00000000000b', 'accepted', '00000000-0000-0000-0004-00000000000a'),
  ('00000000-0000-0000-0004-00000000000a', '00000000-0000-0000-0004-00000000000c', 'accepted', '00000000-0000-0000-0004-00000000000a');

create function pg_temp.act_as(p_user text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', ('00000000-0000-0000-0004-' || p_user)::uuid, 'role', 'authenticated')::text, true);
$$;
create function pg_temp.lot(p_item text default 'wood', p_quantity int default 5) returns jsonb language sql as $$
  select jsonb_build_array(jsonb_build_object('item', p_item, 'quantity', p_quantity));
$$;
create function pg_temp.offer(n int) returns uuid language sql as $$
  select ('00000000-0000-0000-0005-' || lpad(n::text, 12, '0'))::uuid;
$$;

select ok((select relrowsecurity from pg_class where oid = 'public.urb_trade_offers'::regclass), 'urb_trade_offers has row level security enabled');
select is_empty(
  $$ select p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     left join pg_depend d on d.objid = p.oid and d.deptype = 'e'
     where n.nspname = 'public' and d.objid is null and p.proname not like 'urb\_%' $$,
  'every function in public is prefixed urb_'
);

-- Lot validation
select ok(public.urb_lot_is_valid(pg_temp.lot()), 'a one line Lot is valid');
select ok(not public.urb_lot_is_valid('[]'), 'an empty Lot is invalid');
select ok(not public.urb_lot_is_valid(pg_temp.lot('wood', 0)), 'a null quantity is invalid');
select ok(not public.urb_lot_is_valid(pg_temp.lot('wood', 10000)), 'a quantity over 9999 is invalid');
select ok(not public.urb_lot_is_valid('[{"item":"wood","quantity":1},{"item":"wood","quantity":2}]'), 'a duplicated item is invalid');
select ok(not public.urb_lot_is_valid(pg_temp.lot('bad item!', 1)), 'a malformed item is invalid');
select ok(not public.urb_lot_is_valid((select jsonb_agg(jsonb_build_object('item', 'i' || g, 'quantity', 1)) from generate_series(1, 11) g)), 'an 11 line Lot is invalid');
select ok(public.urb_lot_is_valid((select jsonb_agg(jsonb_build_object('item', 'i' || g, 'quantity', 9999)) from generate_series(1, 10) g)), 'a 10 line Lot is valid');

-- Creating
set local role authenticated;
select pg_temp.act_as('00000000000a');
select throws_ok($$ select public.urb_create_trade_offer(pg_temp.offer(1), '00000000-0000-0000-0004-00000000000b', '[]', 10) $$, 'urb_trade_invalid', 'an invalid Lot is refused');
select throws_ok($$ select public.urb_create_trade_offer(pg_temp.offer(1), '00000000-0000-0000-0004-00000000000b', pg_temp.lot(), 10001) $$, 'urb_trade_invalid', 'a price over 10 000 is refused');
select throws_ok($$ select public.urb_create_trade_offer(pg_temp.offer(1), '00000000-0000-0000-0004-00000000000a', pg_temp.lot(), 10) $$, 'urb_trade_invalid', 'an offer to oneself is refused');
select throws_ok($$ select public.urb_create_trade_offer(pg_temp.offer(1), '00000000-0000-0000-0004-00000000000d', pg_temp.lot(), 10) $$, 'urb_not_friends', 'an offer to a non Friend is refused');
select lives_ok($$ select public.urb_create_trade_offer(pg_temp.offer(1), '00000000-0000-0000-0004-00000000000b', pg_temp.lot(), 50) $$, 'an offer to a Friend is created');
select lives_ok($$ select public.urb_create_trade_offer(pg_temp.offer(1), '00000000-0000-0000-0004-00000000000b', pg_temp.lot(), 50) $$, 'creating it again is idempotent');
select throws_ok($$ select public.urb_create_trade_offer(pg_temp.offer(1), '00000000-0000-0000-0004-00000000000b', pg_temp.lot(), 60) $$, 'urb_trade_conflict', 'reusing an id with other content is refused');
select lives_ok($$ select public.urb_create_trade_offer(pg_temp.offer(2), '00000000-0000-0000-0004-00000000000b', pg_temp.lot('planks', 2), 0) $$, 'a gift (price 0) is created');
select lives_ok($$ select public.urb_create_trade_offer(pg_temp.offer(3), '00000000-0000-0000-0004-00000000000c', pg_temp.lot(), 5) $$, 'a third offer is created');
select lives_ok($$ select public.urb_create_trade_offer(pg_temp.offer(4), '00000000-0000-0000-0004-00000000000c', pg_temp.lot(), 5) $$, 'a fourth offer is created');
select lives_ok($$ select public.urb_create_trade_offer(pg_temp.offer(5), '00000000-0000-0000-0004-00000000000c', pg_temp.lot(), 5) $$, 'a fifth offer is created');
select throws_ok($$ select public.urb_create_trade_offer(pg_temp.offer(6), '00000000-0000-0000-0004-00000000000c', pg_temp.lot(), 5) $$, 'urb_cap_trades_open', 'a sixth open offer is refused');

-- Listing
select is(jsonb_array_length(public.urb_list_social() -> 'offers'), 5, 'the sender sees the open offers');
select is(public.urb_list_social() -> 'offers' -> 4 ->> 'role', 'sender', 'as sender');
select pg_temp.act_as('00000000000b');
select is(jsonb_array_length(public.urb_list_social() -> 'offers'), 2, 'the recipient sees only the offers addressed to them');
select is((public.urb_list_social() -> 'offers' -> 1 ->> 'peerHandle'), 'Alice', 'with the Handle of the sender, never an email');

-- Accept and claims
select pg_temp.act_as('00000000000a');
select throws_ok($$ select public.urb_accept_trade_offer(pg_temp.offer(1)) $$, 'urb_trade_unavailable', 'the sender cannot accept their own offer');
select pg_temp.act_as('00000000000c');
select throws_ok($$ select public.urb_accept_trade_offer(pg_temp.offer(1)) $$, 'urb_trade_unavailable', 'a third party cannot accept');
select pg_temp.act_as('00000000000b');
select lives_ok($$ select public.urb_accept_trade_offer(pg_temp.offer(1)) $$, 'the recipient accepts');
select throws_ok($$ select public.urb_accept_trade_offer(pg_temp.offer(1)) $$, 'urb_trade_unavailable', 'an offer cannot be accepted twice');
select pg_temp.act_as('00000000000a');
select throws_ok($$ select public.urb_claim_trade(pg_temp.offer(1), 'payment') $$, 'urb_trade_unavailable', 'the sender is not paid before the recipient has the Lot');
select throws_ok($$ select public.urb_claim_trade(pg_temp.offer(1), 'lot') $$, 'urb_trade_unavailable', 'the sender cannot claim a Lot that went to the recipient');
select pg_temp.act_as('00000000000b');
select is(public.urb_claim_trade(pg_temp.offer(1), 'lot') ->> 'effect', 'receive-lot', 'the recipient claims the Lot');
select is((public.urb_claim_trade(pg_temp.offer(1), 'lot') ->> 'alreadyClaimed')::boolean, true, 'a repeated claim answers again, flagged as already claimed');
select pg_temp.act_as('00000000000a');
select is((public.urb_claim_trade(pg_temp.offer(1), 'payment') ->> 'urbs')::int, 50, 'the sender then claims the payment');
select is((public.urb_claim_trade(pg_temp.offer(1), 'payment') ->> 'alreadyClaimed')::boolean, true, 'and again without a second payment');

-- Refuse and cancel
select pg_temp.act_as('00000000000b');
select lives_ok($$ select public.urb_decline_trade_offer(pg_temp.offer(2)) $$, 'the recipient refuses an offer');
select throws_ok($$ select public.urb_claim_trade(pg_temp.offer(2), 'lot') $$, 'urb_trade_unavailable', 'the recipient cannot claim a refused Lot');
select pg_temp.act_as('00000000000a');
select is(public.urb_claim_trade(pg_temp.offer(2), 'lot') ->> 'effect', 'return-lot', 'the sender claims the Lot back');
select lives_ok($$ select public.urb_decline_trade_offer(pg_temp.offer(3)) $$, 'the sender cancels an open offer');
select pg_temp.act_as('00000000000d');
select throws_ok($$ select public.urb_decline_trade_offer(pg_temp.offer(4)) $$, 'urb_trade_unavailable', 'a stranger cannot cancel it');

-- Isolation
select throws_ok($$ select count(*) from public.urb_trade_offers $$, '42501', null, 'offers are not readable directly');
reset role;
set local role anon;
select throws_ok($$ select public.urb_claim_trade(pg_temp.offer(1), 'lot') $$, '42501', null, 'anon cannot claim');
reset role;

-- Expiry of an open offer, lapse of an accepted one
update public.urb_trade_offers set expires_at = now() - interval '1 minute' where id = pg_temp.offer(4);
select public.urb_expire_offers();
select is((select state from public.urb_trade_offers where id = pg_temp.offer(4)), 'expired', 'an open offer expires after its deadline');
set local role authenticated;
select pg_temp.act_as('00000000000a');
select is(public.urb_claim_trade(pg_temp.offer(4), 'lot') ->> 'effect', 'return-lot', 'and the Lot returns to its sender');

reset role;
insert into public.urb_trade_offers (id, sender_id, recipient_id, lot, price, state, expires_at, accepted_at, claim_deadline)
  values (pg_temp.offer(20), '00000000-0000-0000-0004-00000000000a', '00000000-0000-0000-0004-00000000000b', pg_temp.lot(), 80, 'accepted', now() + interval '1 day', now() - interval '4 days', now() - interval '1 day');
select public.urb_expire_offers();
select is((select state from public.urb_trade_offers where id = pg_temp.offer(20)), 'lapsed', 'an accepted offer whose Lot is not claimed in time lapses');
set local role authenticated;
select pg_temp.act_as('00000000000a');
select is(public.urb_claim_trade(pg_temp.offer(20), 'lot') ->> 'effect', 'return-lot', 'the Lot goes back to the sender');
select throws_ok($$ select public.urb_claim_trade(pg_temp.offer(20), 'payment') $$, 'urb_trade_unavailable', 'and the sender is not paid');
select pg_temp.act_as('00000000000b');
select is(public.urb_claim_trade(pg_temp.offer(20), 'payment') ->> 'effect', 'return-payment', 'the payment goes back to the recipient');

-- Daily limit
reset role;
delete from public.urb_trade_offers where sender_id = '00000000-0000-0000-0004-00000000000a';
insert into public.urb_trade_offers (id, sender_id, recipient_id, lot, price, state, created_at, expires_at)
  select pg_temp.offer(100 + g), '00000000-0000-0000-0004-00000000000a', '00000000-0000-0000-0004-00000000000b', pg_temp.lot(), 1, 'refused', now() - interval '1 hour', now() + interval '1 day' from generate_series(1, 30) g;
set local role authenticated;
select pg_temp.act_as('00000000000a');
select throws_ok($$ select public.urb_create_trade_offer(pg_temp.offer(200), '00000000-0000-0000-0004-00000000000b', pg_temp.lot(), 1) $$, 'urb_rate_limited', 'the 31st offer within a day is refused');

-- Block and unfriend close the offers
reset role;
delete from public.urb_trade_offers;
insert into public.urb_trade_offers (id, sender_id, recipient_id, lot, price, state, expires_at, accepted_at, claim_deadline) values
  (pg_temp.offer(300), '00000000-0000-0000-0004-00000000000a', '00000000-0000-0000-0004-00000000000b', pg_temp.lot(), 5, 'open', now() + interval '1 day', null, null),
  (pg_temp.offer(301), '00000000-0000-0000-0004-00000000000a', '00000000-0000-0000-0004-00000000000b', pg_temp.lot(), 5, 'accepted', now() + interval '1 day', now(), now() + interval '3 days');
set local role authenticated;
select pg_temp.act_as('00000000000b');
select public.urb_block_user('00000000-0000-0000-0004-00000000000a');
reset role;
select is((select state from public.urb_trade_offers where id = pg_temp.offer(300)), 'cancelled', 'a Block cancels the open offers between the two');
select is((select state from public.urb_trade_offers where id = pg_temp.offer(301)), 'lapsed', 'and lapses the accepted ones whose Lot is unclaimed');

-- Deleting cloud data
insert into public.urb_trade_offers (id, sender_id, recipient_id, lot, price, state, expires_at)
  values (pg_temp.offer(310), '00000000-0000-0000-0004-00000000000a', '00000000-0000-0000-0004-00000000000c', pg_temp.lot(), 5, 'open', now() + interval '1 day');
set local role authenticated;
select pg_temp.act_as('00000000000c');
select public.urb_delete_my_saves();
select pg_temp.act_as('00000000000a');
select is(public.urb_claim_trade(pg_temp.offer(310), 'lot') ->> 'effect', 'return-lot', 'when the recipient deletes their data, the sender gets the Lot back');

select * from finish();
rollback;
