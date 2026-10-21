"use client";

import { useEffect, useRef } from "react";
import { subscribeToChanges } from "../services/realtime";

// Se usa en cada pantalla de listado: cuando otra PC crea/edita/anula
// algo de esa entidad, "callback" se llama solo para volver a pedir la
// lista — no hace falta que nadie apriete F5. "entity" tiene que
// coincidir exactamente con la constante correspondiente de
// DataEntities en el backend (ver Backend/EcowayBackend.BC/Realtime)
export function useRealtimeRefresh(entity: string | null | undefined, callback: () => void) {
  // Ref para no tener que pedirle al llamador que memorice el callback
  // con useCallback — cada pantalla ya tiene su propio "load..." normal
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!entity) return;

    const unsubscribe = subscribeToChanges(entity, () => callbackRef.current());
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entity]);
}
