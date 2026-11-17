# Base de datos EcoWay

PostgreSQL 18 (servicio `pg` en `deploy/docker-compose.yml`), BD `app`, usuario de la app `ecoway`.
Migrada desde SQL Server el 16-nov-2026.

- `migrations/`: cambios numerados (`0001_schema_inicial.sql`, `0002_...`).
  El migrador (DbUp) los aplica en cada deploy, en orden y una sola vez.
- `respaldos/`: scripts del servidor (respaldo diario 3:17, WAL a Drive, prueba de restauración).
- Las tablas de HangFire las crea la propia librería; no van aquí.
- Los datos **nunca** van a git. Los respaldos están en el servidor, en `/mnt/backup`.
