#!/bin/sh
# Obraz Postgres ignoruje podkatalogi w docker-entrypoint-initdb.d — migracje odpalamy tutaj (kolejność: sort -V).
set -eu
MIGRATIONS_DIR="/docker-entrypoint-initdb.d/migrations"
if [ ! -d "$MIGRATIONS_DIR" ]; then
  echo "Brak $MIGRATIONS_DIR — pomijam migracje."
  exit 0
fi
# shellcheck disable=SC2044
for f in $(find "$MIGRATIONS_DIR" -maxdepth 1 -name '*.sql' | sort -V); do
  [ -f "$f" ] || continue
  echo "==> $(basename "$f")"
  psql -v ON_ERROR_STOP=1 -U "${POSTGRES_USER:-postgres}" -d "${POSTGRES_DB:-postgres}" -f "$f"
done
