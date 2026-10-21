import { API_URL } from "../services/config";

// parchea el fetch global una vez para detectar cuando la sesion expira
// (401) y mandar al usuario a Login en vez de dejarlo en una pantalla rota

let installed = false;
let loggingOut = false;
// guardado aparte para que forceLogout pueda llamar al logout sin pasar
// otra vez por el fetch parchado
let originalFetch: typeof fetch;

// estos no deben disparar el guard: login normal, el chequeo de status
// inicial, y el logout mismo
const EXCLUDED_PATHS = ["/userLogin/login", "/userLogin/GetStatus", "/userLogin/logout"];

// solo avisa "sesion expirada" si de verdad hubo una sesion antes, para
// no confundir eso con un 401 de alguien que entro sin haber iniciado sesion
const SESSION_FLAG_KEY = "ecoway_session_established";

export function markSessionEstablished() {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(SESSION_FLAG_KEY, "1");
}

export function clearSessionEstablished() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(SESSION_FLAG_KEY);
}

function hasEstablishedSession(): boolean {
  return sessionStorage.getItem(SESSION_FLAG_KEY) === "1";
}

function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

async function forceLogout() {
  if (loggingOut) return;
  loggingOut = true;

  sessionStorage.removeItem("mustChangePassword");

  // La cookie es HttpOnly, no se puede borrar desde JS, hay que pedirle
  // al backend que la invalide. Si no se hace esto, middleware.ts todavia
  // ve la cookie como presente y rebota de Login de vuelta al sistema
  try {
    await (originalFetch ?? fetch)(`${API_URL}/userLogin/logout`, {
      method: "POST",
      credentials: "include",
    });
  } catch {
    // si falla el logout igual seguimos, lo importante es redirigir
  }

  clearSessionEstablished();

  // se importa aca y no arriba para no cargar sweetalert2 si nunca hace falta
  const { default: Swal } = await import("sweetalert2");

  await Swal.fire({
    icon: "info",
    title: "Sesión finalizada",
    text: "Tu sesión expiró por inactividad. Volvé a iniciar sesión.",
    confirmButtonText: "Entendido",
  });

  window.location.href = "/Login";
}

export function installSessionGuard() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  originalFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const response = await originalFetch(input, init);
    const url = requestUrl(input);
    const isOwnApi = url.startsWith(API_URL);
    const isExcluded = EXCLUDED_PATHS.some((path) => url.includes(path));

    if (isOwnApi && !isExcluded && response.ok) {
      markSessionEstablished();
    }

    if (isOwnApi && !isExcluded && response.status === 401) {
      if (hasEstablishedSession() && window.location.pathname !== "/Login") {
        forceLogout();
      }
    }

    return response;
  };
}
