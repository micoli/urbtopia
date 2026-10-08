-- Gives the service roles created by the Supabase Postgres image the local password.
\set pgpass `echo "$POSTGRES_PASSWORD"`

select format('alter user %I with password %L', rolname, :'pgpass')
from pg_roles
where rolname in ('authenticator', 'supabase_auth_admin', 'supabase_storage_admin', 'supabase_functions_admin')
\gexec
