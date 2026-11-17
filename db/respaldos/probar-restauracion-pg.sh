#!/usr/bin/env bash
# =====================================================================
# Prueba de restauración de PostgreSQL. NO toca producción:
# levanta un Postgres temporal, SIN red, en una carpeta temporal y lo borra al terminar.
#
#  A) Copia física + WAL (lo que se usaría en un desastre):
#     último pg-base.tar.gz + /mnt/backup/pgwal -> recupera hasta el último WAL archivado.
#  B) Copia lógica: último app.pgdump -> pg_restore en otra base.
#  Compara count(*) de cada tabla de A y B contra la base de producción.
#
# Uso: sudo ./probar-restauracion-pg.sh
# =====================================================================
set -euo pipefail

IMG=postgres:18.7
PROD=ecoway-pg-1
WAL=/mnt/backup/pgwal
NOMBRE=prueba-restauracion-pg

[ "$(id -u)" = 0 ] || { echo "Correr con sudo." >&2; exit 1; }
CARPETA=$(ls -1d /mnt/backup/diario/*/ | sort | while read -r d; do [ -f "$d/pg-base.tar.gz" ] && echo "$d"; done | tail -n1)
[ -n "$CARPETA" ] || { echo "No hay ningún pg-base.tar.gz en /mnt/backup/diario (¿ya corrió backup-servidor.sh?)" >&2; exit 1; }
echo "Respaldo: $CARPETA"

TMP=$(mktemp -d /var/tmp/restauracion-pg.XXXXXX)
limpiar() { docker rm -f "$NOMBRE" >/dev/null 2>&1 || true; rm -rf "$TMP"; }
trap limpiar EXIT

echo "== A) Copia física + WAL"
mkdir -p "$TMP/datos"
tar xzf "$CARPETA/pg-base.tar.gz" -C "$TMP/datos"
cat >> "$TMP/datos/postgresql.auto.conf" <<'EOF'
restore_command = 'gunzip < /wal/%f.gz > %p'
recovery_target_action = 'promote'
archive_mode = off
EOF
touch "$TMP/datos/recovery.signal"
chown -R 999:999 "$TMP/datos"
chmod 700 "$TMP/datos"

docker run -d --name "$NOMBRE" --network none \
  -v "$TMP/datos:/var/lib/postgresql/18/docker" -v "$WAL:/wal:ro" \
  "$IMG" postgres -c shared_buffers=128MB -c max_connections=50 >/dev/null
# max_connections (y max_worker_processes, etc.) no pueden ser menores que en el
# servidor original, o la recuperación aborta ("insufficient parameter settings").

echo -n "   recuperando (aplica los WAL)"
for i in $(seq 1 180); do
  if docker exec "$NOMBRE" psql -U postgres -d app -tAc 'SELECT NOT pg_is_in_recovery()' 2>/dev/null | grep -q t; then
    echo " listo"; break
  fi
  if [ "$(docker inspect -f '{{.State.Running}}' "$NOMBRE" 2>/dev/null)" != true ]; then
    echo; echo "El contenedor de prueba se detuvo. Log:"; docker logs --tail 30 "$NOMBRE"; exit 1
  fi
  sleep 2; echo -n .
  [ "$i" = 180 ] && { echo; echo "No terminó de recuperar en 6 min. Log:"; docker logs --tail 30 "$NOMBRE"; exit 1; }
done
docker exec "$NOMBRE" psql -U postgres -d app -tAc \
  "SELECT 'recuperado hasta: ' || coalesce(pg_last_xact_replay_timestamp()::text, '(sin transacciones después del respaldo)')"

echo "== B) Copia lógica (pg_restore de app.pgdump en la base 'verif')"
docker exec "$NOMBRE" psql -q -U postgres -c 'CREATE DATABASE verif'
docker exec -i "$NOMBRE" pg_restore -U postgres -d verif --no-owner --exit-on-error < "$CARPETA/app.pgdump"
echo "   restaurado sin errores"

echo "== Comparar count(*) con producción"
TABLAS=$(docker exec "$PROD" psql -U postgres -d app -tAc \
  "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY 1")
Q=$(for t in $TABLAS; do printf "SELECT '%s', count(*) FROM \"%s\" UNION ALL " "$t" "$t"; done)
Q="${Q% UNION ALL }"
docker exec "$PROD"   psql -U postgres -d app   -tA -F'|' -c "$Q" | sort > "$TMP/prod.txt"
docker exec "$NOMBRE" psql -U postgres -d app   -tA -F'|' -c "$Q" | sort > "$TMP/fisica.txt"
docker exec "$NOMBRE" psql -U postgres -d verif -tA -F'|' -c "$Q" | sort > "$TMP/logica.txt"

printf '%-34s %12s %12s %12s\n' TABLA PRODUCCION "FISICA+WAL" LOGICA
join -t'|' "$TMP/prod.txt" "$TMP/fisica.txt" | join -t'|' - "$TMP/logica.txt" \
  | awk -F'|' '{ m = ($2==$3 && $2==$4) ? "" : "   <-- distinto"; if (m != "") d++
                 printf "%-34s %12s %12s %12s%s\n", $1, $2, $3, $4, m }
               END { print ""; if (d) print "AVISO: " d " tabla(s) difieren. Si la app escribió después del respaldo es normal (la física+WAL debería estar más cerca de producción)."
                     else print "RESULTADO: restauración OK, las " NR " tablas coinciden con producción." }'
