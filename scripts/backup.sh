#!/usr/bin/env bash
# Backup the SQLite database with integrity verification and 7-day retention.
# Usage: ./scripts/backup.sh
# Env:   DATA_DIR, DATABASE_PATH, BACKUP_RETAIN_DAYS
set -euo pipefail

DATA_DIR="${DATA_DIR:-$(pwd)/data}"
DB_PATH="${DATABASE_PATH:-$DATA_DIR/app.db}"
BACKUP_DIR="$DATA_DIR/backups"
RETAIN_DAYS="${BACKUP_RETAIN_DAYS:-7}"

if [ ! -f "$DB_PATH" ]; then
  echo "No database at $DB_PATH — nothing to back up."
  exit 0
fi

mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date -u +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/app_${TIMESTAMP}.db"

sqlite3 "$DB_PATH" ".backup '$BACKUP_FILE'"
echo "Backup written: $BACKUP_FILE"

RESULT=$(sqlite3 "$BACKUP_FILE" "PRAGMA integrity_check")
if [ "$RESULT" != "ok" ]; then
  echo "ERROR: Backup integrity check failed — removing corrupt backup."
  rm -f "$BACKUP_FILE"
  exit 1
fi
echo "Integrity OK"

find "$BACKUP_DIR" -name "app_*.db" -mtime +"$RETAIN_DAYS" -delete
echo "Cleaned up backups older than $RETAIN_DAYS days."
