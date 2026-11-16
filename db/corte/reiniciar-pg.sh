#!/usr/bin/env bash
# =====================================================================
# Deja VACÍA la base `app` de PostgreSQL (ecoway-pg-1), dueña ecoway.
# Para repetir el ensayo desde cero o antes del corte real (así el
# migrador crea el esquema y queda registrado en su tabla de control).
#
# NO toca SQL Server ni el volumen de SQL Server.
# Se niega a correr si la api ya usa PostgreSQL (después del corte).
#
# Uso: sudo ./db/corte/reiniciar-pg.sh
# =====================================================================
set -euo pipefail
PG=ecoway-pg-1

[ "$(id -u)" = 0 ] || { echo "Correr con sudo." >&2; exit 1; }
if docker inspect "$(docker ps -qf name=ecoway-api-1)" --format '{{range .Config.Env}}{{println .}}{{end}}' \
     | grep -q 'Host=pg'; then
  echo "La api YA usa PostgreSQL: borrar la base ahora perdería datos reales. No hago nada." >&2
  exit 1
fi

echo "Esto BORRA la base 'app' de PostgreSQL (ensayo). SQL Server no se toca."
read -r -p "Escribí REINICIAR para confirmar: " ok
[ "$ok" = REINICIAR ] || { echo "Cancelado."; exit 1; }

docker exec "$PG" psql -v ON_ERROR_STOP=1 -U postgres -d postgres \
  -c 'DROP DATABASE IF EXISTS app WITH (FORCE)' \
  -c 'CREATE DATABASE app OWNER ecoway'
echo "Base 'app' de PostgreSQL vacía y lista (dueño: ecoway)."
