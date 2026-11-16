#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
export IMAGE_TAG="${1:-prod}"
STAMP=$(date +%Y%m%d_%H%M%S)

echo ">> Descargando imágenes ($IMAGE_TAG)"
docker compose --profile tools pull

echo ">> Levantando PostgreSQL (espera al healthcheck)"
if ! docker compose up -d --wait --wait-timeout 600 pg; then
  echo "!! PostgreSQL no quedó listo en 10 min. No se sigue con el deploy." >&2
  docker compose ps pg >&2
  exit 1
fi

# Usuario de la app (idempotente). psql lee las contraseñas de variables del contenedor
# con \getenv: no aparecen en la línea de comandos ni en el log del deploy.
# También se sincroniza la de postgres: POSTGRES_PASSWORD solo se aplica al crear el volumen.
docker compose exec -T pg psql -q -v ON_ERROR_STOP=1 -U postgres -d app <<'SQL'
\getenv pw PG_APP_PASSWORD
\getenv pwadmin POSTGRES_PASSWORD
SELECT format('CREATE ROLE ecoway LOGIN PASSWORD %L', :'pw')
 WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ecoway') \gexec
SELECT format('ALTER ROLE ecoway WITH LOGIN PASSWORD %L', :'pw') \gexec
SELECT format('ALTER ROLE postgres WITH PASSWORD %L', :'pwadmin') \gexec
SQL

echo ">> Backup predeploy (pg_dump)"
# Se escribe dentro del contenedor (root) en /backup = /mnt/backup/sql del host.
docker compose exec -T pg sh -c "pg_dump -U postgres -Fc app > /backup/predeploy_${STAMP}.dump"
docker compose exec -T pg pg_restore --list "/backup/predeploy_${STAMP}.dump" > /dev/null

echo ">> Migraciones"
docker compose --profile tools run --rm migrator

echo ">> Actualizando servicios"
docker compose up -d --remove-orphans
docker compose exec -T caddy caddy reload --config /etc/caddy/Caddyfile

echo ">> Limpieza (backups predeploy de más de 7 días)"
docker compose exec -T pg find /backup -name 'predeploy_*.dump' -mtime +7 -delete
docker image prune -f
echo ">> Deploy $IMAGE_TAG listo"
