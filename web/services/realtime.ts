// Conexion unica de SignalR para toda la app: cada pantalla se suscribe
// (subscribe) a la entidad que le interesa y recibe un aviso cuando otra
// PC cambio algo de esa entidad, sin tener que refrescar el navegador.
// Usa la misma cookie de sesion que el resto del API (withCredentials),
// asi que no hace falta manejar tokens aparte aca.
import * as signalR from "@microsoft/signalr";
import { API_URL } from "./config";

// API_URL ya trae "/api" al final (ver config.ts)
const HUB_URL = `${API_URL}/hubs/data`;

let connection: signalR.HubConnection | null = null;
// Cuantos listeners activos hay por entidad, para saber cuando hace falta
// unirse (Join) o cuando ya no queda nadie escuchando y toca salirse (Leave)
const groupRefCounts = new Map<string, number>();
const listeners = new Map<string, Set<() => void>>();

function getConnection(): signalR.HubConnection {
  if (connection) return connection;

  connection = new signalR.HubConnectionBuilder()
    .withUrl(HUB_URL, { withCredentials: true })
    .withAutomaticReconnect()
    .configureLogging(signalR.LogLevel.Warning)
    .build();

  connection.on("changed", (entity: string) => {
    listeners.get(entity)?.forEach((cb) => cb());
  });

  // Si se cae y reconecta, hay que volver a unirse a los grupos que
  // estaban activos — SignalR no los recuerda solo
  connection.onreconnected(() => {
    groupRefCounts.forEach((count, entity) => {
      if (count > 0) connection?.invoke("Join", entity).catch(() => {});
    });
  });

  connection.start().catch(() => {
    // Si no hay sesion todavia (login) o el hub no esta disponible, no
    // pasa nada grave: la pantalla sigue funcionando, solo sin el
    // refresco automatico hasta que se pueda conectar
  });

  return connection;
}

// Se suscribe a los avisos de cambio de una entidad ("materials",
// "tickets", etc. — ver DataEntities en el backend). Devuelve una funcion
// para des-suscribirse, se debe llamar al desmontar el componente
export function subscribeToChanges(entity: string, callback: () => void): () => void {
  const conn = getConnection();

  if (!listeners.has(entity)) listeners.set(entity, new Set());
  listeners.get(entity)!.add(callback);

  const refCount = (groupRefCounts.get(entity) ?? 0) + 1;
  groupRefCounts.set(entity, refCount);

  if (refCount === 1) {
    const join = () => conn.invoke("Join", entity).catch(() => {});
    if (conn.state === signalR.HubConnectionState.Connected) {
      join();
    } else {
      conn.start().then(join).catch(() => {});
    }
  }

  return () => {
    listeners.get(entity)?.delete(callback);

    const remaining = (groupRefCounts.get(entity) ?? 1) - 1;
    groupRefCounts.set(entity, remaining);

    if (remaining <= 0) {
      groupRefCounts.delete(entity);
      if (conn.state === signalR.HubConnectionState.Connected) {
        conn.invoke("Leave", entity).catch(() => {});
      }
    }
  };
}
