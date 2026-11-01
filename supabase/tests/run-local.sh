#!/usr/bin/env bash
# Runs every migration and the RLS tests on a throwaway local Postgres cluster.
# Needs Postgres 15+ binaries (initdb, pg_ctl, psql) on PATH. Touches no Supabase project.
set -euo pipefail

here="$(cd "$(dirname "$0")" && pwd)"
root="$(cd "$here/../.." && pwd)"
work="$(mktemp -d)"
port="${PGTEST_PORT:-54998}"
trap 'pg_ctl -D "$work/data" -m immediate stop >/dev/null 2>&1 || true; rm -rf "$work"' EXIT

initdb -D "$work/data" -U postgres --auth=trust >/dev/null
pg_ctl -D "$work/data" -o "-p $port -k $work" -l "$work/log" start >/dev/null
psql_run() { psql -h "$work" -p "$port" -U postgres -d postgres -v ON_ERROR_STOP=1 -q "$@"; }

psql_run -f "$here/supabase-stubs.sql"
for migration in "$root"/supabase/migrations/*.sql; do
  echo "apply $(basename "$migration")"
  psql_run -f "$migration"
done
psql_run -f "$here/platform_rls.test.sql"

echo "rollback check"
psql_run -f "$root/supabase/rollbacks/20261101000000_platform_schema.down.sql"
psql_run -f "$root/supabase/migrations/20261101000000_platform_schema.sql"
echo "ok"
