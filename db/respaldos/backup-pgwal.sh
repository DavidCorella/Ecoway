#!/usr/bin/env bash
# /usr/local/bin/backup-pgwal.sh — sube a Drive los WAL de PostgreSQL (cron cada 2 min).
# Equivalente de backup-log.sh para PostgreSQL: el archivado lo hace el propio Postgres
# (archive_command -> /mnt/backup/pgwal, comprimido); este script solo los copia a Drive.
# La limpieza local (8 días) la hace backup-servidor.sh.
set -euo pipefail
umask 077

DIR=/mnt/backup/pgwal
LOG=/var/log/backup-pgwal.log

[ -d "$DIR" ] || exit 0
exec >>"$LOG" 2>&1

rclone copy "$DIR" gcrypt:pgwal --max-age 2h --include '*.gz'
rclone delete --min-age 30d gcrypt:pgwal

ULTIMO=$(ls -1t "$DIR"/*.gz 2>/dev/null | head -n1 || true)
echo "$(date '+%F %T') OK $(basename "${ULTIMO:-ninguno}")"
