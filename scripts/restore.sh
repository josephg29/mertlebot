#!/usr/bin/env bash
# Restore SQLite database from a backup file.
# Usage: ./scripts/restore.sh <backup-file>
set -euo pipefail

DATA_DIR="${DATA_DIR:-$(pwd)/data}"
DB_PATH="${DATABASE_PATH:-$DATA_DIR/app.db}"

BACKUP_FILE="${1:-}"
if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: $0 <backup-file>"
  echo "Available backups:"
  ls -1t "$DATA_DIR/backups/"
  exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "ERROR: Backup file not found: $BACKUP_FILE"
  exit 1
fi

RESULT=$(sqlite3 "$BACKUP_FILE" "PRAGMA integrity_check")
if [ "$RESULT" != "ok" ]; then
  echo "ERROR: Backup integrity check failed — aborting restore."
  exit 1
fi

if [ -f "$DB_PATH" ]; then
  cp "$DB_PATH" "${DB_PATH}.pre-restore"
  echo "Existing database saved to: ${DB_PATH}.pre-restore"
fi

cp "$BACKUP_FILE" "$DB_PATH"
echo "Restored: $BACKUP_FILE → $DB_PATH"
