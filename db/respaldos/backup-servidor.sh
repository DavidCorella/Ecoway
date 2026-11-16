#!/usr/bin/env bash
# /usr/local/bin/backup-servidor.sh — respaldo completo diario (cron 3:17).
# Igual al anterior + sección 1b (PostgreSQL de EcoWay). Lo de SQL Server queda intacto
# hasta unos días después del corte.
set -euo pipefail
umask 077

FECHA=$(date +%F_%H%M)
BASE=/mnt/backup
DEST=$BASE/diario/$FECHA
LOG=/var/log/backup-servidor.log
DB=ecoway-db-1
PG=ecoway-pg-1
PDATA=/opt/sites/personal/data

mkdir -p "$DEST"
exec >>"$LOG" 2>&1
echo "===== $(date '+%F %T') inicio"

sql() {
  docker exec "$DB" bash -c '/opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -C -b -h -1 -W -Q "$1"' _ "$1"
}

# 1. Bases de datos SQL Server
if [ "$(docker inspect -f '{{.State.Running}}' "$DB" 2>/dev/null)" = true ]; then
  DBS=$(sql "SET NOCOUNT ON; SELECT name FROM sys.databases WHERE database_id > 4" | tr -d '\r')
  for db in $DBS; do
    echo "-- BD $db"
    sql "BACKUP DATABASE [$db] TO DISK = N'/backup/$db.bak' WITH INIT, CHECKSUM"
    mv "$BASE/sql/$db.bak" "$DEST/"
    gzip "$DEST/$db.bak"
  done
else
  echo "-- SQL Server ($DB) no está corriendo: se omite"
fi

# 1b. PostgreSQL de EcoWay (si el contenedor existe y corre)
#   - pg-base.tar.gz: copia física. Con los WAL de /mnt/backup/pgwal permite restaurar
#     a cualquier momento posterior (pérdida máxima ~2 min, como con los .trn).
#   - app.pgdump: copia lógica (pg_dump -Fc), la más simple de restaurar en otra máquina.
#   Conexión por el socket local del contenedor: no usa contraseñas.
if [ "$(docker inspect -f '{{.State.Running}}' "$PG" 2>/dev/null)" = true ]; then
  echo "-- PostgreSQL: copia física (pg_basebackup)"
  docker exec "$PG" pg_basebackup -U postgres -D - -Ft -X none -z -c fast > "$DEST/pg-base.tar.gz"
  echo "-- PostgreSQL: copia lógica (pg_dump app)"
  docker exec "$PG" pg_dump -U postgres -Fc app > "$DEST/app.pgdump"
  # Comprueba que el dump se puede leer (lista su contenido sin restaurar nada)
  docker exec -i "$PG" pg_restore --list > /dev/null < "$DEST/app.pgdump"
else
  echo "-- PostgreSQL ($PG) no está corriendo: se omite"
fi

# 2. Volumenes de EcoWay
for v in $(docker volume ls -q | grep -E '_(uploads|dpkeys)$'); do
  echo "-- volumen $v"
  docker run --rm -v "$v":/data:ro -v "$DEST":/out alpine tar czf "/out/vol-$v.tar.gz" -C /data .
done

# 3. Datos de los sitios personales (SQLite con copia consistente)
if [ -d "$PDATA" ]; then
  echo "-- datos personales"
  TMP=$(mktemp -d)
  cp -a "$PDATA"/. "$TMP"/
  find "$PDATA" -type f \( -name '*.db' -o -name '*.sqlite' -o -name '*.sqlite3' \) | while read -r f; do
    sqlite3 "$f" ".backup '$TMP/${f#$PDATA/}'"
  done
  tar czf "$DEST/personal-data.tar.gz" -C "$TMP" --exclude='*-wal' --exclude='*-shm' .
  rm -rf "$TMP"
fi

# 4. Configuracion de los stacks
tar czf "$DEST/config-stacks.tar.gz" --ignore-failed-read \
  /opt/sites/*/.env /opt/sites/*/docker-compose.yml /opt/sites/*/caddy /etc/docker/daemon.json

# 5. Limpieza local (7 dias)
find "$BASE/sql" -name "predeploy_*.bak" -mtime +7 -delete
find "$BASE/sql" -name "predeploy_*.dump" -mtime +7 -delete
find "$BASE/diario" -mindepth 1 -maxdepth 1 -type d -mtime +7 -exec rm -rf {} +
# WAL de PostgreSQL: se guardan 8 días (un día más que la copia física más vieja que se conserva)
[ -d "$BASE/pgwal" ] && find "$BASE/pgwal" -name '*.gz' -mtime +8 -delete

# 6. Subir a Drive cifrado y limpiar (30 dias)
rclone copy "$DEST" "gcrypt:diario/$FECHA"
rclone delete --min-age 30d gcrypt:diario
rclone rmdirs --leave-root gcrypt:diario

du -sh "$DEST"
echo "===== $(date '+%F %T') fin OK"
