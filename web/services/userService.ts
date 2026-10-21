// ======================================================
// CONFIGURACIÓN
// ======================================================

import { API_URL as BASE_URL } from "./config";

// ======================================================
// INTERFACES
// ======================================================

export interface Roles {
    id: string;
    nombre: string;
}

export interface Screen {
    id: string;
    name: string;
}

export interface RolePermission {
    roleId: string;
    screenId: string;
    hasPermission: boolean;
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
// ROLES
// ======================================================

export const getRoles = async (): Promise<Roles[]> => {

    const res = await fetch(
        `${BASE_URL}/PermisionsData/GetRoles`,
        {
            credentials: "include",
        }
    );

    return handleResponse<Roles[]>(res);
};

export const createRole = async (name: string) => {

    const roleData = {
        name: name,
    };

    const response = await fetch(
        `${BASE_URL}/PermisionsData/CreateRole`,
        {
            method: "POST",

            headers: {
                "Content-Type":
                    "application/json",
            },

            credentials: "include",

            body: JSON.stringify(roleData),
        }
    );

    // con handleResponse llega el mensaje real del backend (ej. "Ya
    // existe un rol llamado...") en vez de un texto generico
    return handleResponse(response);
};

export const deleterole = async (id: number) => {

    const response = await fetch(
        `${BASE_URL}/PermisionsData/DeleteRole?id=${id}`,
        {
            method: "DELETE",

            headers: {
                "Content-Type":
                    "application/json",
            },

            credentials: "include",

        }
    );

    // igual que createRole, para que llegue el mensaje real (ej. "El rol
    // esta siendo usado en un usuario")
    return handleResponse(response);
};

// ======================================================
// SCREENS / PANTALLAS
// ======================================================

export const getScreens = async (): Promise<Screen[]> => {

    const res = await fetch(
        `${BASE_URL}/PermisionsData/GetScreen`,
        {
            credentials: "include",
        }
    );

    return handleResponse<Screen[]>(res);
};

// ======================================================
// PERMISOS DE ROLES
// ======================================================

export const saveRolePermissions = async (
    data: {
        role_id: string;
        screen_id: string;
        active : boolean;
    }[]
): Promise<void> => {
    const res = await fetch(
        `${BASE_URL}/PermisionsData/PutAccess`,
        {
            method: "PUT",

            headers: {
                "Content-Type":
                    "application/json",
            },

            credentials: "include",

            body: JSON.stringify(data),
        }
    );

    if (!res.ok) {

        const text = await res.text();

        throw new Error(
            text || "Error guardando permisos"
        );
    }

    return;
};

export const getPermision = async (roleId: number, screenId: number): Promise<boolean> => {

    const res = await fetch(
        `${BASE_URL}/PermisionsData/GetPermision?roleID=${roleId}&screenID=${screenId}`,
        {
            credentials: "include",
        }
    );

    return handleResponse<boolean>(res);
};

