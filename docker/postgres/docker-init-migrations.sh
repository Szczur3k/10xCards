#!/bin/sh
# Initdb: uruchamia wszystkie *.sql z /migrations (sort -V).
set -eu
for f in $(find /migrations -maxdepth 1 -name '*.sql' 2>/dev/null | sort -V); do
  [ -f "$f" ] || continue
  echo "==> $(basename "$f")"
  psql -v ON_ERROR_STOP=1 -U postgres -d postgres -f "$f"
done
