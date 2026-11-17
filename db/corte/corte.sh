#!/usr/bin/env bash
# =====================================================================
# CORTE SQL Server -> PostgreSQL (datos). Corre EN EL SERVIDOR, en horario tranquilo.
#
#  1. Comprobaciones previas (no toca nada si algo no está bien).
#  2. Detiene api y web  -> nadie escribe en SQL Server (el sitio queda caído).
#  3. Respaldo final de SQL Server: /mnt/backup/sql/precorte_<fecha>.bak (guardarlo).
#  4. Deja vacía la BD `app` de PostgreSQL y crea el esquema con el migrador.
#  5. Copia los datos con pgloader (usuarios temporales), revalida FK/CHECK y
#     compara count(*) exacto de las 33 tablas.
#
#  Si algo falla en 2-5: vuelve a arrancar api y web (siguen con SQL Server) y sale.
#  Si todo sale bien: api y web QUEDAN DETENIDAS. Ahí se hace el push de main a prod
#  y el deploy las levanta apuntando a PostgreSQL.
#
# Uso: sudo ./corte/corte.sh
# =====================================================================
set -euo pipefail

DB=ecoway-db-1
PG=ecoway-pg-1
API=ecoway-api-1
WEB=ecoway-web-1
RED=ecoway_interna
# Migrador de PostgreSQL ya construido (idéntico al de main: db/migrator y db/migrations sin cambios).
MIGRADOR=ghcr.io/davidcorella/ecoway-migrator:5e6d6e940d1eb64bd84369d250e8a04a40d04fea
PGLOADER_IMG=dimitri/pgloader:latest
STAMP=$(date +%Y%m%d_%H%M%S)
U=pgloader_tmp

paso() { echo; echo "== $*"; }
die()  { echo "!! $*" >&2; exit 1; }

# ---------------------------------------------------------------- 1. previas
paso "1/5 Comprobaciones previas (no se toca nada todavía)"
[ "$(id -u)" = 0 ] || die "Correr con sudo."
for c in "$DB" "$PG"; do
  [ "$(docker inspect -f '{{.State.Health.Status}}' "$c" 2>/dev/null)" = healthy ] || die "$c no está healthy."
done
docker network inspect "$RED" >/dev/null || die "No existe la red $RED."
docker image inspect "$MIGRADOR" >/dev/null 2>&1 || die "No está la imagen del migrador de PostgreSQL ($MIGRADOR)."
docker image inspect "$PGLOADER_IMG" >/dev/null 2>&1 || docker pull -q "$PGLOADER_IMG" >/dev/null
if docker inspect "$API" --format '{{range .Config.Env}}{{println .}}{{end}}' | grep -q 'Host=pg'; then
  die "La api YA usa PostgreSQL: el corte ya se hizo."
fi
LIBRE=$(df --output=avail -B1G /mnt/backup | tail -n1 | tr -d ' ')
[ "$LIBRE" -ge 5 ] || die "Poco espacio en /mnt/backup (${LIBRE} GB)."
echo "   todo OK"
echo
echo "El sitio de EcoWay va a quedar CAÍDO desde ahora hasta que termine el deploy (~15-20 min)."
read -r -p "Escribí CORTE para empezar: " ok
[ "$ok" = CORTE ] || die "Cancelado (no se tocó nada)."

# A partir de acá, cualquier falla vuelve a levantar la app con SQL Server.
TMP=$(mktemp -d /root/corte-pg.XXXXXX); chmod 700 "$TMP"
TERMINADO=0
psql_pg() { docker exec -i "$PG" psql -q -v ON_ERROR_STOP=1 -U "$1" -d "${2:-app}"; }
sql_ms()  { docker exec -i "$DB" sh -c 'SQLCMDPASSWORD="$MSSQL_SA_PASSWORD" exec /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -C -b -h -1 -W -i /dev/stdin'; }
borrar_temporales() {
  sql_ms >/dev/null 2>&1 <<SQL || true
IF EXISTS (SELECT 1 FROM app.sys.database_principals WHERE name = N'$U') EXEC('USE [app]; DROP USER [$U];');
IF EXISTS (SELECT 1 FROM sys.server_principals WHERE name = N'$U') DROP LOGIN [$U];
SQL
  docker exec -i "$PG" psql -q -U postgres -d postgres -c "DROP ROLE IF EXISTS $U" >/dev/null 2>&1 || true
}
al_salir() {
  borrar_temporales
  rm -rf "$TMP"
  if [ "$TERMINADO" != 1 ]; then
    echo
    echo "!! El corte NO terminó. Vuelvo a levantar api y web con SQL Server..."
    docker start "$API" "$WEB" >/dev/null && echo "   api y web arriba de nuevo (SQL Server). Producción como antes."
  fi
}
trap al_salir EXIT

# ---------------------------------------------------------------- 2. detener
paso "2/5 Deteniendo api y web"
docker stop "$API" "$WEB" >/dev/null
echo "   detenidas (nadie escribe en SQL Server)"

# ---------------------------------------------------------------- 3. respaldo final
paso "3/5 Respaldo final de SQL Server"
sql_ms <<SQL
BACKUP DATABASE [app] TO DISK = N'/backup/precorte_${STAMP}.bak' WITH INIT, CHECKSUM;
SQL
echo "   /mnt/backup/sql/precorte_${STAMP}.bak  <- GUARDARLO (es el punto de vuelta atrás)"

# ---------------------------------------------------------------- 4. esquema
paso "4/5 PostgreSQL vacío + esquema con el migrador"
psql_pg postgres postgres <<'SQL'
DROP DATABASE IF EXISTS app WITH (FORCE);
CREATE DATABASE app OWNER ecoway;
SQL
umask 077
# La contraseña de ecoway se toma del contenedor pg y va en un archivo temporal (no en la línea de comandos).
{ printf 'ConnectionStrings__DefaultConnection=Host=pg;Port=5432;Database=app;Username=ecoway;Password='
  docker exec "$PG" printenv PG_APP_PASSWORD; } > "$TMP/migrador.env"
docker run --rm --network "$RED" --env-file "$TMP/migrador.env" "$MIGRADOR"
rm -f "$TMP/migrador.env"

# ---------------------------------------------------------------- 5. datos
paso "5/5 Copia de datos (pgloader), validación y conteo"
psql_pg ecoway <<'SQL'
DROP INDEX IF EXISTS "UQ_Company_NombreProyecto";
ALTER TABLE "Company" DROP COLUMN IF EXISTS "project_key";
ALTER TABLE "Company" ADD COLUMN "project_key" varchar(150) COLLATE ci;
SQL
borrar_temporales
PW_MS=$(openssl rand -hex 20); PW_PG=$(openssl rand -hex 20)
sql_ms >/dev/null <<SQL
CREATE LOGIN [$U] WITH PASSWORD = N'$PW_MS', CHECK_POLICY = OFF, DEFAULT_DATABASE = [app];
EXEC('USE [app]; CREATE USER [$U] FOR LOGIN [$U]; ALTER ROLE db_datareader ADD MEMBER [$U]; GRANT VIEW DEFINITION TO [$U];');
SQL
psql_pg postgres <<SQL
CREATE ROLE $U LOGIN SUPERUSER PASSWORD '$PW_PG';
SQL
cat > "$TMP/carga.load" <<EOF
LOAD DATABASE
  FROM mssql://$U:$PW_MS@db:1433/app
  INTO postgresql://$U:$PW_PG@pg:5432/app
WITH data only, truncate, disable triggers, quote identifiers,
     create no tables, create no indexes, no foreign keys, reset no sequences,
     workers = 4, concurrency = 1, batch rows = 50000, prefetch rows = 50000
SET PostgreSQL PARAMETERS timezone to 'UTC'
CAST type datetime to timestamptz drop default drop not null,
     type uniqueidentifier to uuid drop default drop not null using sql-server-uniqueidentifier-to-uuid
INCLUDING ONLY TABLE NAMES LIKE '%' IN SCHEMA 'dbo'
ALTER SCHEMA 'dbo' RENAME TO 'public';
EOF
docker run --rm --network "$RED" -e TDSVER=7.4 -v "$TMP/carga.load:/carga.load:ro" "$PGLOADER_IMG" \
  pgloader /carga.load 2>&1 | sed -E 's#(://[^:/@]+:)[^@]*@#\1****@#g' | tee "$TMP/pgloader.log" | tail -n 42
borrar_temporales

psql_pg ecoway <<'SQL'
ALTER TABLE "Company" DROP COLUMN "project_key";
ALTER TABLE "Company" ADD COLUMN "project_key" varchar(150) COLLATE ci
  GENERATED ALWAYS AS (coalesce("project", '')) STORED;
CREATE UNIQUE INDEX "UQ_Company_NombreProyecto" ON "Company" ("nombre_comercial", "project_key");
SELECT setval(pg_get_serial_sequence('"Nationality"', 'optionsNationality'),
              coalesce((SELECT max("optionsNationality") FROM "Nationality"), 1)) \g /dev/null
DO $$ DECLARE r record; BEGIN
  FOR r IN SELECT conrelid::regclass AS t, conname, pg_get_constraintdef(oid) AS def
           FROM pg_constraint
           WHERE contype IN ('f','c') AND connamespace = 'public'::regnamespace
           ORDER BY contype DESC LOOP
    EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I, ADD CONSTRAINT %I %s', r.t, r.conname, r.conname, r.def);
  END LOOP; END $$;
SQL
docker exec "$PG" psql -q -U postgres -d app -c 'ANALYZE'
echo "   FK y CHECK válidos"

TABLAS=$(docker exec "$PG" psql -U ecoway -d app -tAc "SELECT tablename FROM pg_tables WHERE schemaname='public'
                                                       AND tablename <> 'schemaversions' ORDER BY 1")
Q_PG=$(for t in $TABLAS; do printf "SELECT '%s', count(*) FROM \"%s\" UNION ALL " "$t" "$t"; done)
docker exec "$PG" psql -U ecoway -d app -tA -F'|' -c "${Q_PG% UNION ALL }" | sort > "$TMP/pg.txt"
Q_MS="SET NOCOUNT ON; $(for t in $TABLAS; do printf "SELECT '%s|' + CAST(COUNT_BIG(*) AS varchar(20)) FROM [app].[dbo].[%s] UNION ALL " "$t" "$t"; done)"
sql_ms <<< "${Q_MS% UNION ALL }" | grep '|' | sort > "$TMP/ms.txt"
printf '%-34s %12s %12s\n' TABLA "SQL SERVER" POSTGRES
join -t'|' -a1 -a2 -e '-' -o 0,1.2,2.2 "$TMP/ms.txt" "$TMP/pg.txt" \
  | awk -F'|' '{ m = ($2==$3) ? "" : "   <-- DISTINTO"; printf "%-34s %12s %12s%s\n", $1, $2, $3, m; if ($2!=$3) d++ }
               END { if (d) exit 1; print ""; print "Las " NR " tablas coinciden." }' \
  || die "Hay tablas con conteos distintos: el corte se cancela."

TERMINADO=1
echo
echo "================================================================="
echo " DATOS LISTOS EN POSTGRESQL. api y web siguen DETENIDAS."
echo " Siguiente paso: push de main a prod (el deploy las levanta con PostgreSQL)."
echo " Respaldo de vuelta atrás: /mnt/backup/sql/precorte_${STAMP}.bak"
echo "================================================================="
