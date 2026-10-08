#!/bin/sh
# Applies supabase/migrations/*.sql once each, tracked in the same table the Supabase CLI uses.
set -eu

psql_run="psql -h db -U postgres -d postgres -v ON_ERROR_STOP=1 -q"

$psql_run -c "create schema if not exists supabase_migrations;
create table if not exists supabase_migrations.schema_migrations (version text primary key, name text, statements text[]);"

for file in /migrations/*.sql; do
  base="$(basename "$file" .sql)"
  version="${base%%_*}"
  name="${base#*_}"
  applied="$($psql_run -tA -c "select 1 from supabase_migrations.schema_migrations where version = '$version'")"
  [ -z "$applied" ] || continue
  echo "Applying $base"
  $psql_run --single-transaction -f "$file"
  $psql_run -c "insert into supabase_migrations.schema_migrations (version, name) values ('$version', '$name')"
done
echo "Migrations up to date"
