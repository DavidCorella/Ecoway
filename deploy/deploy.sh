#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
export IMAGE_TAG="${1:-prod}"
STAMP=$(date +%Y%m%d_%H%M%S)
SQL='/opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -C -P "$MSSQL_SA_PASSWORD"'

echo ">> Descargando imágenes ($IMAGE_TAG)"
docker compose --profile tools pull

echo ">> Levantando la base de datos"
docker compose up -d db
for i in $(seq 1 30); do
  if docker compose exec -T db bash -c "$SQL -Q 'SELECT 1'" >/dev/null 2>&1; then break; fi
  sleep 2
done

echo ">> Backup"
docker compose exec -T db bash -c "$SQL -Q \"BACKUP DATABASE [app] TO DISK = N'/backup/predeploy_${STAMP}.bak' WITH INIT\""

echo ">> Migraciones"
docker compose --profile tools run --rm migrator

echo ">> Actualizando servicios"
docker compose up -d --remove-orphans
docker compose exec -T caddy caddy reload --config /etc/caddy/Caddyfile

echo ">> Limpieza (backups de más de 7 días)"
docker compose exec -T db find /backup -name 'predeploy_*.bak' -mtime +7 -delete
docker image prune -f
echo ">> Deploy $IMAGE_TAG listo"