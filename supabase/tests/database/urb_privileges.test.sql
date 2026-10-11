begin;
create extension if not exists pgtap with schema extensions;
select plan(4);

-- Supabase grants EXECUTE on every new function of public to anon and authenticated:
-- a migration that forgets its revoke fails here.
select is_empty(
  $$ select p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname like 'urb\_%' and has_function_privilege('anon', p.oid, 'execute') $$,
  'anon can execute no urb_ function'
);

select results_eq(
  $$ select p.proname::text collate "default" from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname like 'urb\_%' and has_function_privilege('authenticated', p.oid, 'execute')
     order by 1 $$,
  $$ select unnest(array[
       'urb_accept_friend_request', 'urb_accept_trade_offer', 'urb_block_user', 'urb_claim_trade', 'urb_create_trade_offer',
       'urb_decline_trade_offer', 'urb_delete_my_saves', 'urb_list_messages', 'urb_list_saves', 'urb_list_social',
       'urb_push_save', 'urb_refuse_friend_request', 'urb_remove_friend', 'urb_restore_save', 'urb_send_friend_request_by_email',
       'urb_send_message', 'urb_set_findable', 'urb_set_handle', 'urb_unblock_user'
     ]) order by 1 $$,
  'authenticated can execute only the client-facing urb_ functions'
);

select is_empty(
  $$ select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relkind in ('r', 'v', 'm')
       and has_table_privilege('anon', c.oid, 'select, insert, update, delete, truncate, references, trigger') $$,
  'anon has no privilege on any table'
);

select results_eq(
  $$ select (c.relname::text || ':' || priv) collate "default" from pg_class c join pg_namespace n on n.oid = c.relnamespace
     cross join unnest(array['select', 'insert', 'update', 'delete', 'truncate', 'references', 'trigger']) priv
     where n.nspname = 'public' and c.relkind in ('r', 'v', 'm') and has_table_privilege('authenticated', c.oid, priv)
     order by 1 $$,
  $$ values ('urb_profiles:select'), ('urb_saves:select') $$,
  'authenticated can only read its own saves and profile'
);

select * from finish();
rollback;
