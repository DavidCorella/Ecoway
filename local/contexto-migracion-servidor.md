# Contexto: llevar EcoWay a PostgreSQL en el servidor (fase 2)

Repo: DavidCorella/Ecoway (D:\Server\ecoway-prod). Deploy = push a `prod` (runner self-hosted, usuario deployer).
Reglas: no tocar producción sin avisar; mostrar diff antes de cada commit; no mezclar `main` en `prod`
hasta que el servidor esté listo (ver "Orden del corte").

## Estado al 2026-11-16 (fase 1 terminada)

Commit `2fd4223` en `main` (push hecho, NO está en `prod`):
- API: EF Core con Npgsql 9.0.4 en los 4 contextos (UseNpgsql + EnableRetryOnFailure), Hangfire.PostgreSql 1.21.1
  (crea solo su esquema `hangfire`), excepciones de duplicado/FK con PostgresException (23505 / 23503).
- Columnas solo-fecha marcadas `[Column(TypeName = "date")]`; `UtcDateTimeConverter` normaliza a UTC al escribir.
- Migrador: dbup-postgresql 7.0.1 (`PostgresqlDatabase`), lee `/migrations` (o `MIGRATIONS_PATH`).
- `db/migrations/0001_schema_inicial.sql`: 33 tablas, collation ICU `ci` (und-u-ks-level2, no determinística:
  no distingue mayúsculas, sí tildes = SQL_Latin1_General_CP1_CI_AS), timestamptz UTC, mismos nombres de
  restricciones. `Company.project_key` es columna generada. Requiere **PostgreSQL 18** (LIKE con collation no
  determinística).
- `deploy/` NO se tocó: docker-compose.yml y deploy.sh siguen con SQL Server. Por eso `main` hoy no se puede
  desplegar.

Probado en local con una copia real de producción (`app.bak` del 16-nov):
- pgloader cargó 3.734.112 filas en 21 s, 0 errores; conteos idénticos en las 33 tablas; UUIDs, fechas (ms),
  tildes/ñ idénticos; FK y CHECK revalidados sin violaciones.
- API completa sobre Postgres: 34 GET OK; flujo de escritura completo OK (catálogos, empresa, acta entrada,
  procesamiento, acta salida, cotización + anulación, certificado, resumen); duplicados con otra capitalización
  → 409 como antes; borrar catálogo en uso → 409; búsquedas sin distinción de mayúsculas = mismos resultados que
  SQL Server.
- Datos: casi todo es `PersonalData` (padrón, 3,7 M filas, nombres con espacios al final; el código hace Trim).
  Tablas transaccionales casi vacías hoy (2 usuarios, 1 empresa, 0 actas).

## Qué hay que hacer en el servidor

### 1. docker-compose.yml
- Servicio nuevo `pg`: imagen fijada `postgres:18.7` (no `latest`), volumen nuevo (p. ej. externo
  `ecoway_pg-data`), `POSTGRES_DB=app`, usuario propio (no usar `postgres` para la app), contraseña desde `.env`
  (`PG_PASSWORD`), healthcheck con `pg_isready -U <usuario> -d app`, montar `/mnt/backup/sql:/backup`.
- Ajustes de memoria para un servidor de 7 GB (ej.: `shared_buffers=256MB`, `effective_cache_size=1GB`,
  `work_mem=8MB`, `max_connections=50`) vía `command: postgres -c ...`.
- `api` y `migrator`: `ConnectionStrings__DefaultConnection=Host=pg;Port=5432;Database=app;Username=<usuario>;Password=${PG_PASSWORD}`
  y `depends_on: pg: condition: service_healthy`.
- El servicio `db` (SQL Server) y su volumen `miapp_db-data` se quedan **intactos y apagados** unos días para
  poder volver atrás. No borrar el volumen.

### 2. deploy.sh
- Esperar la BD: `docker compose up -d --wait pg`.
- Respaldo predeploy: `pg_dump -Fc -U <usuario> app > /backup/predeploy_${STAMP}.dump` (dentro del contenedor pg).
- Limpieza: `predeploy_*.dump` de más de 7 días.
- Migrador sin cambios de uso (`docker compose --profile tools run --rm migrator`).

### 3. Respaldos del servidor (NO modificar sin avisar)
- Hoy: `/usr/local/bin/backup-servidor.sh` (diario 3:17, BACKUP DATABASE → app.bak.gz) y
  `/usr/local/bin/backup-log.sh` (BACKUP LOG cada 2 min → .trn, a Drive con rclone gcrypt).
- Reemplazo: `pg_dump -Fc` diario + archivado de WAL (pgBackRest o `archive_command`) para mantener la pérdida
  máxima de ~2 min; mismo destino rclone. **Probar una restauración completa antes del corte.**

### 4. Dashboard (repo Personal, Dashboard/)
- El recolector consulta SQL Server (tamaño, modelo FULL, límite Express, LastGoodCheckDbTime) y
  estado-acciones.py hace RESTORE VERIFYONLY y DBCC CHECKDB → pasar a `pg_database_size`, estado del archivado
  WAL (`pg_stat_archiver`), `pg_restore --list` sobre el dump y `pg_amcheck`.

## Migración de datos (sin perder los de producción)

Se hace con la API detenida, así no entra ningún dato nuevo a SQL Server mientras se copia.
Ensayarla primero completa en el servidor con el `pg` en paralelo (pasos 3 a 8) sin detener nada:
es repetible porque pgloader hace TRUNCATE.

1. Avisar la ventana (horario tranquilo; la carga real tarda < 1 min, el total ~15-20 min).
2. `docker compose stop api web` (SQL Server sigue arriba, sin escrituras).
3. Respaldo final de SQL Server: `BACKUP DATABASE [app] TO DISK='/backup/precorte_<fecha>.bak'` (guardarlo).
4. `pg` arriba y vacío → correr el migrador (crea el esquema 0001).
5. Antes de cargar: `ALTER TABLE "Company" DROP COLUMN "project_key"; ADD COLUMN "project_key" varchar(150) COLLATE ci;`
   y `DROP INDEX "UQ_Company_NombreProyecto";` (pgloader no puede escribir en la columna generada).
6. pgloader (imagen `dimitri/pgloader:latest`, env `TDSVER=7.4`, en la misma red de docker que `db` y `pg`):
   ```
   LOAD DATABASE
     FROM mssql://sa:<pass>@db:1433/app
     INTO postgresql://<usuario>:<pass>@pg:5432/app
   WITH data only, truncate, disable triggers, quote identifiers,
        create no tables, create no indexes, no foreign keys, reset no sequences,
        workers = 4, concurrency = 1, batch rows = 50000, prefetch rows = 50000
   SET PostgreSQL PARAMETERS timezone to 'UTC'
   CAST type datetime to timestamptz drop default drop not null,
        type uniqueidentifier to uuid drop default drop not null using sql-server-uniqueidentifier-to-uuid
   INCLUDING ONLY TABLE NAMES LIKE '%' IN SCHEMA 'dbo'
   ALTER SCHEMA 'dbo' RENAME TO 'public';
   ```
   `disable triggers` necesita superusuario: correr pgloader con el usuario `postgres`. Los avisos
   "casted to type text" y "Max connections reached, increase value of TDS_MAX_CONN" son inofensivos.
7. Después de cargar:
   ```sql
   ALTER TABLE "Company" DROP COLUMN "project_key";
   ALTER TABLE "Company" ADD COLUMN "project_key" varchar(150) COLLATE ci GENERATED ALWAYS AS (coalesce("project", '')) STORED;
   CREATE UNIQUE INDEX "UQ_Company_NombreProyecto" ON "Company" ("nombre_comercial", "project_key");
   SELECT setval(pg_get_serial_sequence('"Nationality"', 'optionsNationality'), (SELECT max("optionsNationality") FROM "Nationality"));
   -- revalida FK y CHECK (pgloader desactivó triggers): falla si algún dato los viola
   DO $$ DECLARE r record; BEGIN
     FOR r IN SELECT conrelid::regclass AS t, conname FROM pg_constraint
              WHERE contype IN ('f','c') AND connamespace = 'public'::regnamespace LOOP
       EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I, ADD CONSTRAINT %I %s', r.t, r.conname, r.conname,
         (SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conname = r.conname AND conrelid = r.t));
     END LOOP; END $$;
   ANALYZE;
   ```
   Si la tabla de usuarios tiene permisos: dar `GRANT` sobre las tablas al usuario de la app si pgloader cargó
   como `postgres` y las tablas son de otro dueño (o crear el esquema con el usuario de la app y cargar con
   postgres: los datos no cambian de dueño).
8. Verificar: `count(*)` exacto por tabla en ambos motores (no usar `n_live_tup`, es estimado) y comparar las 33;
   muestreo de UUIDs/fechas/tildes. Si algo no cuadra → no seguir, volver a levantar api/web con SQL Server.
9. Desplegar el código: mezclar `main` en `prod` (con el compose/deploy.sh nuevos) → el workflow corre
   deploy.sh: respaldo pg_dump, migrador (0001 ya aplicada → no hace nada), levanta api/web contra `pg`.
   Hangfire recrea sus tablas y vuelve a registrar el job `UpdatePrice` (0 2 * * * UTC) solo.
10. Probar en producción: login, búsquedas, crear y anular un documento de prueba, revisar ErrorLogs.

### Volver atrás
Revertir `prod` al commit anterior (`ccad011`) → api vuelve a SQL Server con los datos del corte.
Lo que se haya escrito en Postgres después del corte NO estaría en SQL Server: decidir rápido (primeras horas).

## Archivos de referencia en la PC de David (fuera de git)
- `local/backups/app.bak` (copia de prod del 16-nov), `local/pgloader/load.load` (versión local del paso 6).
- Contenedores de prueba: `ecoway-pg` (puerto 5433, volumen `ecoway-pg-data`), `ecoway-mssql` (puerto 14330).
  Tienen el padrón: borrarlos al terminar.
