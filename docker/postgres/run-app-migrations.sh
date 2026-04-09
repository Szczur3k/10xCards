#!/bin/sh
# Migracje public.* wymagają istniejącego auth.users (tworzy GoTrue przy starcie).
# Ten kontener jednorazowy uruchamia się po fiszki-auth i czeka na tabelę auth.users.
set -eu
export PGPASSWORD="${POSTGRES_PASSWORD:-postgres}"
PGHOST="${PGHOST:-fiszki-postgres}"
PGUSER="${PGUSER:-postgres}"
PGDATABASE="${PGDATABASE:-postgres}"

if psql -h "$PGHOST" -U "$PGUSER" -d "$PGDATABASE" -tAc \
  "SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users'" \
  | grep -q 1; then
  echo "public.users już istnieje — pomijam migracje i seed."
  exit 0
fi

echo "Czekam na auth.users (GoTrue)..."
i=0
while [ "$i" -lt 90 ]; do
  if psql -h "$PGHOST" -U "$PGUSER" -d "$PGDATABASE" -tAc \
    "SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users'" \
    | grep -q 1; then
    echo "auth.users jest."
    break
  fi
  i=$((i + 1))
  sleep 2
done
if [ "$i" -eq 90 ]; then
  echo "Timeout: brak auth.users — sprawdź logi fiszki-auth"
  exit 1
fi

echo "Role anon / authenticated (jeśli brak — dla RLS i PostgREST):"
psql -h "$PGHOST" -U "$PGUSER" -d "$PGDATABASE" -v ON_ERROR_STOP=1 <<'EOSQL'
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN NOINHERIT;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN NOINHERIT;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'service_role') THEN
    CREATE ROLE service_role NOLOGIN NOINHERIT BYPASSRLS;
  END IF;
END
$$;
EOSQL

echo "Migracje aplikacji:"
for f in $(find /migrations -maxdepth 1 -name '*.sql' | sort -V); do
  [ -f "$f" ] || continue
  echo "==> $(basename "$f")"
  psql -v ON_ERROR_STOP=1 -h "$PGHOST" -U "$PGUSER" -d "$PGDATABASE" -f "$f"
done

if [ -f /seed.sql ]; then
  echo "Seed:"
  psql -v ON_ERROR_STOP=1 -h "$PGHOST" -U "$PGUSER" -d "$PGDATABASE" -f /seed.sql
fi

echo "Migracje zakończone."
