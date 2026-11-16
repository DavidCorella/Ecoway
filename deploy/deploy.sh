#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
export IMAGE_TAG="${1:-prod}"
STAMP=$(date +%Y%m%d_%H%M%S)
SQL='/opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -C -P "$MSSQL_SA_PASSWORD"'

echo ">> Descargando imágenes ($IMAGE_TAG)"
docker compose --profile tools pull

echo ">> Levantando la base de datos (espera al healthcheck; una actualización de SQL Server puede tardar minutos)"
if ! docker compose up -d --wait --wait-timeout 900 db; then
  echo "!! La base de datos no quedó lista en 15 min. No se sigue con el deploy." >&2
  docker compose ps db >&2
  exit 1
fi

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

# PostgreSQL corre en paralelo hasta el corte: la app todavía NO depende de él.
# Va al final para que un problema acá no frene el deploy de la app.
echo ">> PostgreSQL (en paralelo; la app todavía usa SQL Server)"
if docker compose up -d --wait --wait-timeout 300 pg; then
  # Usuario de la app (idempotente). psql lee la contraseña de una variable del contenedor
  # con \getenv: no aparece en la línea de comandos ni en el log del deploy.
  docker compose exec -T pg psql -q -v ON_ERROR_STOP=1 -U postgres -d app <<'SQL'
\getenv pw PG_APP_PASSWORD
SELECT format('CREATE ROLE ecoway LOGIN PASSWORD %L', :'pw')
 WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ecoway') \gexec
SELECT format('ALTER ROLE ecoway WITH LOGIN PASSWORD %L', :'pw') \gexec
-- Dueño de la BD: así el migrador (que conecta como ecoway) puede crear el esquema en public.
ALTER DATABASE app OWNER TO ecoway;
SQL
  echo ">> PostgreSQL listo (usuario ecoway)"
else
  echo "!! PostgreSQL no quedó listo; la app no depende de él todavía." >&2
  docker compose ps pg >&2
fi
echo ">> Deploy $IMAGE_TAG listo"