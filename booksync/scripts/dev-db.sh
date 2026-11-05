#!/usr/bin/env bash
# Démarre un PostgreSQL local pour le développement et les tests (sans Docker).
# Usage : scripts/dev-db.sh [dossier-de-données]
set -euo pipefail
DATA_DIR="${1:-${PGDATA_DIR:-$HOME/.booksync-pg}}"
BIN="$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1)"
RUN_AS=""
[ "$(id -u)" = "0" ] && RUN_AS="postgres"
run() { if [ -n "$RUN_AS" ]; then su "$RUN_AS" -c "$*"; else bash -c "$*"; fi; }

if [ ! -d "$DATA_DIR/data" ]; then
  mkdir -p "$DATA_DIR"; [ -n "$RUN_AS" ] && chown "$RUN_AS" "$DATA_DIR"
  run "$BIN/initdb -D $DATA_DIR/data -A trust -U postgres -E UTF8 >/dev/null"
fi
if ! run "$BIN/pg_ctl -D $DATA_DIR/data status >/dev/null 2>&1"; then
  run "$BIN/pg_ctl -D $DATA_DIR/data -l $DATA_DIR/log -o '-p 5432 -k /tmp' start >/dev/null"
fi
for db in booksync_dev booksync_test; do
  psql -h localhost -U postgres -tAc "select 1 from pg_database where datname='$db'" | grep -q 1 \
    || psql -h localhost -U postgres -qc "create database $db"
done
echo "✔ PostgreSQL prêt sur localhost:5432 (booksync_dev, booksync_test)"
