import { API_URL } from "./config";
import { markSessionEstablished, clearSessionEstablished } from "../utils/sessionGuard";

export interface LoginResponse {
  message?: string;
  mustChange?: boolean;
  error?: string;
}
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export async function loginUser(
  id: string,
  password: string
): Promise<LoginResponse> {
  try {
    const res = await fetch(`${API_URL}/userLogin/login`, {
      method: "POST",
      credentials: "include", // Envía y recibe cookies
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id,
        password,
      }),
    });

   if (!res.ok) {
      let errorMessage = "Error del servidor";

      try {
        const data = await res.json();
        errorMessage = data.error || errorMessage;
      } catch {
        // Si no viene JSON, usamos mensajes por defecto
        if (res.status === 401) {
          errorMessage = "Usuario o Contraseña incorrecta";
        }
      }

      return { error: errorMessage };
    }

    // A partir de aca ya hay sesion real, sessionGuard usa esta marca
    markSessionEstablished();

    return await res.json();
  } catch {
    return {
      error: "Error de conexión con el servidor",
    };
  }
}

export async function logoutUser() {
  clearSessionEstablished();

  await fetch(`${API_URL}/userLogin/logout`, {
    method: "POST",
    credentials: "include" // 🔥 importante
  });
}

export async function getMyPermissions() {
  const res = await fetch(
    `${API_URL}/PermisionsData/GetScreenByRole`,
    {
      credentials: "include"
    }
  );

  return await res.json();
}

export async function getStatus() {
  const res = await fetch(`${API_URL}/userLogin/GetStatus`, {
    credentials: "include",
  });

  // El 401 no trae cuerpo, si se llama res.json() directo tira error
  if (!res.ok) {
    return { status: res.status };
  }

  return await res.json();
}

export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const res = await fetch(
      `${API_URL}/userLogin/ChangePassword`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      return {
        error: data.error || data.message || "No se pudo cambiar la contraseña",
      };
    }

    return {
      success: true,
    };
  } catch {
    return {
      error: "Error de conexión con el servidor",
    };
  }
}


// Pide de forma anonima que un admin revise y reinicie la contraseña de ese usuario
export async function requestPasswordRecovery(
  userid: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const res = await fetch(
      `${API_URL}/userLogin/RequestPasswordRecovery`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ userid }),
      }
    );

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        error: data.error || "No se pudo enviar la solicitud.",
      };
    }

    return { success: true };
  } catch {
    return {
      error: "Error de conexión con el servidor",
    };
  }
}

export async function recoveryPassword(
  newpassword: string,
  userid: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const res = await fetch(
      `${API_URL}/userLogin/RecoveryPassword`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          userid,
          newpassword,
        }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      return {
        error: data.error || data.message || "No se pudo cambiar la contraseña",
      };
    }

    return {
      success: true,
    };
  } catch {
    return {
      error: "Error de conexión con el servidor",
    };
  }
}