\# Base de datos EcoWay



\- `schema/`: estructura de producción (tablas, índices, llaves), exportada con

&#x20; sqlpackage el 21-oct-2026. Es referencia: no se ejecuta en los deploys.

\- `migrations/`: cambios nuevos, numerados (`0001\_descripcion.sql`, `0002\_...`).

&#x20; Se aplican automáticamente en el deploy, en orden, una sola vez.

\- Las tablas de HangFire las crea la propia librería; no van aquí.

\- Los datos \*\*nunca\*\* van a git. Los backups están en el servidor, en `/mnt/backup/sql`.

