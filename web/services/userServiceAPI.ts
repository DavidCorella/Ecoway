// ======================================================
// CONFIGURACIÓN
// ======================================================

import { API_URL as BASE_URL } from "./config";
import { PagedResult } from "./pagination";

// ======================================================
// INTERFACES
// ======================================================

export interface Usuario {
    id: string;
    publicId: string;
    name: string;
    email: string;
    role: string;
    Nacionality: string;
    is_active: boolean;
    position: string | null;
}

// ======================================================
// UTILIDADES
// ======================================================

const handleResponse = async <T>(
    res: Response
): Promise<T> => {

    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Error en API");
    }

    const contentType = res.headers.get("content-type");

    if (
        contentType &&
        contentType.includes("application/json")
    ) {
        return res.json();
    }

    return res.text() as unknown as T;
};

// ======================================================
// USUARIOS
// ======================================================

export interface UsuariosQuery {
    search?: string;
    role?: string;
    status?: string;
    page?: number;
    pageSize?: number;
}

export const getUsuarios = async (query: UsuariosQuery): Promise<PagedResult<Usuario>> => {
    const params = new URLSearchParams();
    if (query.search) params.set("search", query.search);
    if (query.role) params.set("role", query.role);
    if (query.status) params.set("status", query.status);
    params.set("page", String(query.page ?? 1));
    params.set("pageSize", String(query.pageSize ?? 25));

    const res = await fetch(
        `${BASE_URL}/UsersData/GetUsers?${params.toString()}`,
        {
            credentials: "include",
        }
    );

    return handleResponse<PagedResult<Usuario>>(res);
};

export interface UserLookup {
    id: string;
    name: string;
}

// Solo id y nombre de usuarios activos, no requiere permiso de la
// pantalla Usuarios (lo usan Tickets y ExitTickets para elegir un
// responsable de EcoWay)
export const getActiveResponsibles = async (): Promise<UserLookup[]> => {

    const res = await fetch(
        `${BASE_URL}/UsersData/GetActiveResponsibles`,
        {
            credentials: "include",
        }
    );

    return handleResponse<UserLookup[]>(res);
};

// No hay deleteUsuario, un usuario nunca se elimina, solo se activa o inactiva
export const toggleUsuario = async (
    id: string, status: boolean
): Promise<void> => {
    const res = await fetch(
        `${BASE_URL}/UsersData/UpdateStatusUsers?id=${id}&status=${status}`,
        {
            method: "PUT",
            credentials: "include",
        }
    );

    return handleResponse<void>(res);
};

// ======================================================
// CREACIÓN DE USUARIOS
// ======================================================

export const createUser = async (form: Record<string, unknown>, nombre: string) => {

    try {

        const response = await fetch(
            `${BASE_URL}/UsersData/CreateUsers?name=${nombre}`,
            {
                method: "POST",
                headers: {
                    "Content-Type":
                        "application/json",
                },
                credentials: "include",
                body: JSON.stringify(form),
            }
        );
        if (!response.ok) {
            const text = await response.text();
            throw new Error(text || "Error al crear usuario");
        }

        return await response.json();

    } catch (error) {


        throw error;
    }
};

// name es opcional y solo aplica a extranjeros. El endpoint es siempre
// UsersData/UpdateUsers, no existe otro
export const updateUser  = async (form: Record<string, unknown>, name : string | null) => {

    try {

        const response = await fetch(
            name === null || name === undefined
                ? `${BASE_URL}/UsersData/UpdateUsers`
                : `${BASE_URL}/UsersData/UpdateUsers?name=${encodeURIComponent(name)}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type":
                        "application/json",
                },
                credentials: "include",
                body: JSON.stringify(form),
            }
        );

        if (!response.ok) {
            throw new Error(
                "Error al actualizar usuario"
            );
        }

        return await response.json();

    } catch (error) {

        throw error;
    }
};


// ======================================================
// CONSULTA DE NOMBRE POR IDENTIFICACIÓN
// ======================================================

export const getNombreById = async (
    Id: string
) => {

    const res = await fetch(
        `${BASE_URL}/PersonelData/GetName?id=${Id}`,
        {
            method: "GET",
            headers: {
                "Content-Type":
                    "application/json",
            },
            credentials: "include",
        }
    );

    if (!res.ok) {

        const text = await res.text();

        throw new Error(text);
    }

    return res.text();
};

export interface UserProfile {
    id: string;
    role: string;
    name: string;
    position?: string | null;
}

export async function getProfile(): Promise<UserProfile> {
  const res = await fetch(
    `${BASE_URL}/UsersData/GetUserLog`,
    {
      credentials: "include"
    }
  );

  // El 401 no trae cuerpo, si se llama res.json() directo tira error
  if (!res.ok) {
    throw new Error(`Error ${res.status}: ${res.statusText}`);
  }

  return await res.json();
}

export interface NotificationItem {
    id: string;
    title: string;
    message: string;
    created_at: string;
    reference?: string | null;
    action?: string | null;
}

export async function getNotifications(
  screen_id?: string | number,
  id?: string
): Promise<NotificationItem[]> {
  const params = new URLSearchParams();

  if (screen_id !== undefined && screen_id !== null) {
    params.append("screen_id", screen_id.toString());
  }

  if (id) {
    params.append("id", id);
  }

  const res = await fetch(
    `${BASE_URL}/NotificationData/getNotification?${params.toString()}`,
    {
      credentials: "include",
    }
  );

  if (!res.ok) {
    throw new Error(
      `Error ${res.status}: ${res.statusText}`
    );
  }

  const text = await res.text();

  return text ? JSON.parse(text) : [];
}

export async function markAsRead(id: number) {
  const res = await fetch(
    `${BASE_URL}/NotificationData/markRead?id=${id}`,
    {
      method: "PUT",
      credentials: "include",
    }
  );

  return res.ok;
}

export async function createNotification(
  title: string,
  message: string,
  screen_id?: number,
  user_id?: string,
  action? : string,
  reference?: string
) {
  const body: {
    title: string;
    message: string;
    action?: string;
    reference?: string;
    screen_id?: number;
    user_id?: string;
  } = {
    title,
    message
  };
  if (action !== undefined) {
    body.action = action;
  }
  if (reference !== undefined) {
    body.reference = reference;
  }
if (screen_id !== undefined) {
    body.screen_id = screen_id;
  }
  if (user_id) {
    body.user_id = user_id;
  }
  const res = await fetch(
    `${BASE_URL}/NotificationData/createNotification`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    }
  );

  return res.ok;
}