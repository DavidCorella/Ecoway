#!/usr/bin/env bash
# =====================================================================
# Ensayo de la carga SQL Server (db) -> PostgreSQL (pg) EN EL SERVIDOR.
#
# - NO detiene nada: la api sigue usando SQL Server. Solo LEE de `db`.
# - Escribe únicamente en la base `app` de `pg` (que todavía no usa nadie).
# - Repetible: pgloader hace TRUNCATE antes de cargar.
# - Las contraseñas se leen del .env de EcoWay y nunca se muestran.
#
# Uso (en el servidor, desde la carpeta donde copiaste db/):
#   sudo ./db/corte/ensayo-carga.sh db/migrations/0001_schema_inicial.sql
#
# Para el CORTE REAL no se usa este paso 1 (aplicar el esquema a mano):
# primero ./db/corte/reiniciar-pg.sh y el esquema lo crea el migrador.
# =====================================================================
set -euo pipefail

ESQUEMA="${1:?Uso: sudo $0 ruta/a/0001_schema_inicial.sql}"
DIR=/opt/sites/ecoway
RED=ecoway_interna
PG=ecoway-pg-1
DB=ecoway-db-1
PGLOADER_IMG=dimitri/pgloader:latest

[ "$(id -u)" = 0 ] || { echo "Correr con sudo (hay que leer $DIR/.env)." >&2; exit 1; }
[ -f "$ESQUEMA" ] || { echo "No existe $ESQUEMA" >&2; exit 1; }
for c in "$PG" "$DB"; do
  [ "$(docker inspect -f '{{.State.Health.Status}}' "$c" 2>/dev/null)" = healthy ] \
    || { echo "$c no está healthy; no sigo." >&2; exit 1; }
done
docker network inspect "$RED" >/dev/null || { echo "No existe la red $RED" >&2; exit 1; }

# Seguridad: si la api YA usa Postgres, esto no es un ensayo -> no tocar nada.
if docker inspect "$(docker ps -qf name=ecoway-api-1)" --format '{{range .Config.Env}}{{println .}}{{end}}' \
     | grep -q 'Host=pg'; then
  echo "La api ya usa PostgreSQL: este script es solo para el ensayo previo al corte." >&2
  exit 1
fi

psql_pg() { docker exec -i "$PG" psql -q -v ON_ERROR_STOP=1 -U "$1" -d app "${@:2}"; }
# sqlcmd como sa DENTRO del contenedor de SQL Server (la contraseña no sale de ahí). Lee el SQL de stdin.
sql_ms() { docker exec -i "$DB" sh -c 'SQLCMDPASSWORD="$MSSQL_SA_PASSWORD" exec /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -C -b -h -1 -W -i /dev/stdin'; }

# pgloader no decodifica %XX en las URLs: con contraseñas con símbolos falla. Por eso usa
# usuarios TEMPORALES con contraseñas aleatorias de solo letras y números, que se borran al terminar.
# En SQL Server, de solo lectura. Las contraseñas reales de sa y postgres no se usan ni se tocan.
U=pgloader_tmp
borrar_temporales() {
  sql_ms <<SQL >/dev/null 2>&1 || true
IF EXISTS (SELECT 1 FROM app.sys.database_principals WHERE name = N'$U') EXEC('USE [app]; DROP USER [$U];');
IF EXISTS (SELECT 1 FROM sys.server_principals WHERE name = N'$U') DROP LOGIN [$U];
SQL
  docker exec -i "$PG" psql -q -U postgres -d postgres -c "DROP ROLE IF EXISTS $U" >/dev/null 2>&1 || true
}

TMP=$(mktemp -d /root/ensayo-pg.XXXXXX)
chmod 700 "$TMP"
trap 'borrar_temporales; rm -rf "$TMP"' EXIT
borrar_temporales   # por si quedó alguno de un intento anterior

echo "== 1/5 Esquema"
if [ "$(psql_pg ecoway -tAc "SELECT to_regclass('public.\"Roles\"') IS NOT NULL")" = t ]; then
  echo "   ya estaba aplicado (ensayo repetido)"
else
  psql_pg ecoway < "$ESQUEMA"
  echo "   0001 aplicado como ecoway"
fi

echo "== 2/5 Preparar Company.project_key (pgloader no escribe columnas generadas)"
psql_pg ecoway <<'SQL'
DROP INDEX IF EXISTS "UQ_Company_NombreProyecto";
ALTER TABLE "Company" DROP COLUMN IF EXISTS "project_key";
ALTER TABLE "Company" ADD COLUMN "project_key" varchar(150) COLLATE ci;
SQL

echo "== 3/5 Carga con pgloader (solo lee de SQL Server)"
umask 077
PW_MS=$(openssl rand -hex 20)
PW_PG=$(openssl rand -hex 20)
# Las contraseñas van por stdin (no por la línea de comandos).
sql_ms <<SQL >/dev/null
CREATE LOGIN [$U] WITH PASSWORD = N'$PW_MS', CHECK_POLICY = OFF, DEFAULT_DATABASE = [app];
EXEC('USE [app]; CREATE USER [$U] FOR LOGIN [$U]; ALTER ROLE db_datareader ADD MEMBER [$U]; GRANT VIEW DEFINITION TO [$U];');
SQL
# Superusuario temporal: pgloader lo necesita para "disable triggers".
docker exec -i "$PG" psql -q -v ON_ERROR_STOP=1 -U postgres -d app <<SQL
CREATE ROLE $U LOGIN SUPERUSER PASSWORD '$PW_PG';
SQL
echo "   usuarios temporales creados (se borran al terminar)"
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
# La salida se filtra por si pgloader mostrara alguna URL con contraseña.
docker run --rm --network "$RED" -e TDSVER=7.4 -v "$TMP/carga.load:/carga.load:ro" "$PGLOADER_IMG" \
  pgloader /carga.load 2>&1 | sed -E 's#(://[^:/@]+:)[^@]*@#\1****@#g' | tee "$TMP/pgloader.log" | tail -n 45
echo "   (en la tabla de pgloader, la columna 'errors' tiene que ser 0 en todas las filas)"

echo "== 4/5 Restaurar project_key, secuencia y revalidar FK/CHECK"
psql_pg ecoway <<'SQL'
ALTER TABLE "Company" DROP COLUMN "project_key";
ALTER TABLE "Company" ADD COLUMN "project_key" varchar(150) COLLATE ci
  GENERATED ALWAYS AS (coalesce("project", '')) STORED;
CREATE UNIQUE INDEX "UQ_Company_NombreProyecto" ON "Company" ("nombre_comercial", "project_key");
SELECT setval(pg_get_serial_sequence('"Nationality"', 'optionsNationality'),
              coalesce((SELECT max("optionsNationality") FROM "Nationality"), 1)) \g /dev/null
-- pgloader desactivó los triggers: se recrean FK y CHECK para que Postgres los valide.
-- Si algún dato viola una restricción, esto FALLA y el ensayo no está OK.
DO $$ DECLARE r record; BEGIN
  FOR r IN SELECT conrelid::regclass AS t, conname, pg_get_constraintdef(oid) AS def
           FROM pg_constraint
           WHERE contype IN ('f','c') AND connamespace = 'public'::regnamespace
           ORDER BY contype DESC LOOP
    EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I, ADD CONSTRAINT %I %s', r.t, r.conname, r.conname, r.def);
  END LOOP; END $$;
SQL
# Estadísticas de las tablas recién cargadas (como postgres: ecoway no puede analizar el catálogo).
docker exec "$PG" psql -q -U postgres -d app -c 'ANALYZE'
echo "   FK y CHECK válidos"

echo "== 5/5 Comparar count(*) exacto de cada tabla en los dos motores"
TABLAS=$(psql_pg ecoway -tAc "SELECT tablename FROM pg_tables WHERE schemaname='public'
                              AND tablename NOT IN ('schemaversions') ORDER BY 1")
Q_PG=$(for t in $TABLAS; do printf "SELECT '%s', count(*) FROM \"%s\" UNION ALL " "$t" "$t"; done)
psql_pg ecoway -tA -F'|' -c "${Q_PG% UNION ALL }" | sort > "$TMP/pg.txt"
Q_MS="SET NOCOUNT ON; $(for t in $TABLAS; do printf "SELECT '%s|' + CAST(COUNT_BIG(*) AS varchar(20)) FROM [dbo].[%s] UNION ALL " "$t" "$t"; done)"
docker exec -i "$DB" sh -c 'SQLCMDPASSWORD="$MSSQL_SA_PASSWORD" exec /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -C -b -d app -h -1 -W -i /dev/stdin' \
  <<< "${Q_MS% UNION ALL }" | grep '|' | sort > "$TMP/ms.txt"

printf '%-34s %12s %12s\n' TABLA "SQL SERVER" POSTGRES
join -t'|' -a1 -a2 -e '-' -o 0,1.2,2.2 "$TMP/ms.txt" "$TMP/pg.txt" \
  | awk -F'|' '{ m = ($2==$3) ? "" : "   <-- DISTINTO"; printf "%-34s %12s %12s%s\n", $1, $2, $3, m; if ($2!=$3) d++ }
               END { print ""; if (d) { print "RESULTADO: " d " tabla(s) con diferencias. NO seguir con el corte."; exit 1 }
                     else print "RESULTADO: las " NR " tablas coinciden." }'
echo
echo "Nota: la api siguió escribiendo en SQL Server durante el ensayo; si alguna tabla cambió"
echo "mientras se copiaba, puede diferir por pocas filas. En el corte real la api está detenida."
