begin;
create extension if not exists pgtap with schema extensions;
select plan(21);

insert into auth.users (id, instance_id, aud, role, email, email_confirmed_at, is_anonymous, created_at, last_sign_in_at) values
  ('00000000-0000-0000-0009-00000000000a', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'a@example.com', now(), false, now(), now()),
  ('00000000-0000-0000-0009-00000000000b', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'b@example.com', now(), false, now(), now()),
  ('00000000-0000-0000-0009-00000000000c', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', null, null, true, now(), now());

create function pg_temp.act_as(p_user text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', ('00000000-0000-0000-0009-' || p_user)::uuid, 'role', 'authenticated')::text, true);
$$;

select ok((select relrowsecurity from pg_class where oid = 'public.urb_bug_reports'::regclass), 'urb_bug_reports has row level security enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.urb_bug_report_attachments'::regclass), 'attachments have row level security enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.urb_bug_report_replies'::regclass), 'replies have row level security enabled');

set local role authenticated;

-- An anonymous account cannot report
select pg_temp.act_as('00000000000c');
select throws_ok($$ select public.urb_send_bug_report('It broke', null, '{}', null, null, null, null, null) $$, 'urb_email_required', 'an account without an email is refused');

-- Sending
select pg_temp.act_as('00000000000a');
select throws_ok($$ select public.urb_send_bug_report('   ', null, '{}', null, null, null, null, null) $$, 'urb_report_invalid', 'an empty description is refused');
select throws_ok($$ select public.urb_send_bug_report(repeat('x', 4001), null, '{}', null, null, null, null, null) $$, 'urb_report_invalid', 'a description over 4000 characters is refused');
select lives_ok($$ select public.urb_send_bug_report('  Roads vanish  ', '{"x":1,"z":2,"zoom":30}', '{"version":"1"}', 'city-1', 'amber-fox', 'AAAA', '{"a":1}', null) $$, 'a report with a capture and a City is accepted');
select throws_ok($$ select public.urb_send_bug_report('Too big', null, '{}', null, null, repeat('x', 400001), null, null) $$, '23514', null, 'a capture over the size check is refused');
select throws_ok($$ select public.urb_send_bug_report('Two Cities', null, '{}', null, null, null, '{"a":1}', 'AAAA') $$, '23514', null, 'a report cannot carry two copies of the City');

-- The daily limit is five reports
select lives_ok($$ select public.urb_send_bug_report('Two', null, '{}', null, null, null, null, null) $$, 'second report');
select public.urb_send_bug_report('Three', null, '{}', null, null, null, null, null);
select public.urb_send_bug_report('Four', null, '{}', null, null, null, null, null);
select public.urb_send_bug_report('Five', null, '{}', null, null, null, null, null);
select throws_ok($$ select public.urb_send_bug_report('Six', null, '{}', null, null, null, null, null) $$, 'urb_rate_limited', 'the sixth report within a day is refused');

-- Reading
select is(jsonb_array_length(public.urb_list_bug_reports()), 5, 'the author lists their five reports');
select is((public.urb_list_bug_reports() -> 0 ->> 'description'), 'Five', 'newest first');
select pg_temp.act_as('00000000000b');
select is(jsonb_array_length(public.urb_list_bug_reports()), 0, 'another account sees none of them');
select throws_ok($$ select public.urb_get_bug_report(1) $$, 'urb_report_not_found', 'another account cannot open a report');

-- Replies
reset role;
select set_config('urb.rid', (select min(id)::text from public.urb_bug_reports), false);
set local role authenticated;
select pg_temp.act_as('00000000000a');
select throws_ok($$ select public.urb_reply_to_bug_report(current_setting('urb.rid')::bigint, repeat('x', 501)) $$, 'urb_reply_invalid', 'a reply over 500 characters is refused');
reset role;
insert into public.urb_bug_report_replies (report_id, from_admin, body) select min(id), true, 'Thanks, looking' from public.urb_bug_reports;
select ok((select author_unread from public.urb_bug_reports where id = current_setting('urb.rid')::bigint), 'an Admin reply raises the unread flag');
set local role authenticated;
select pg_temp.act_as('00000000000a');
select public.urb_get_bug_report(current_setting('urb.rid')::bigint);
reset role;
select is((select author_unread from public.urb_bug_reports where id = current_setting('urb.rid')::bigint), false, 'opening the report clears the unread flag');
update public.urb_bug_reports set status = 'resolved' where id = current_setting('urb.rid')::bigint;
set local role authenticated;
select pg_temp.act_as('00000000000a');
select throws_ok($$ select public.urb_reply_to_bug_report(current_setting('urb.rid')::bigint, 'Still there') $$, 'urb_report_closed', 'a resolved report takes no reply');

-- Purge and cascade
reset role;
update public.urb_bug_reports set created_at = now() - interval '91 days' where description = 'Two';
update public.urb_bug_reports set resolved_at = now() - interval '31 days' where status = 'resolved';
select public.urb_purge_bug_reports();
select is((select count(*) from public.urb_bug_reports), 3::bigint, 'reports older than 90 days, or resolved over 30 days ago, are purged');
delete from auth.users where id = '00000000-0000-0000-0009-00000000000a';
select is((select count(*) from public.urb_bug_report_attachments) + (select count(*) from public.urb_bug_report_replies) + (select count(*) from public.urb_bug_reports), 0::bigint, 'deleting the account deletes its reports');

select * from finish();
rollback;
