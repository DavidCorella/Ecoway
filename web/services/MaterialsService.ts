export interface Currency {
  id: string;
  name_currency: string;
  price: number;
  dateUpdate: string;
}

export interface Unit {
  id: number;
  name_unit: string;
  description_unit: string;
}

export interface Classify {
  id: number;
  name_classify: string;
  description_classify: string;
}
export interface PhysicalState {
  id: number;
  name_physicalState: string;
  description_physicalState: string;
}

export interface Material {
  id: number;
  description_material: string;
  physical_state: string;
  price: number;
  currency: string;
  unit: string;
  classify: string;
  // dias de plazo para gestionar el material despues de recolectado
  max_management_days: number | null;
}
import { API_URL } from "./config";

/* =========================
   MONEDAS
========================= */

export async function getMoney(): Promise<Currency[]> {
  try {
    const res = await fetch(
      `${API_URL}/CurrencyData/getCurrency`,
      {
        credentials: "include",
      }
    );

    if (!res.ok) {
      throw new Error("Error al obtener monedas");
    }

    return await res.json();
  } catch {

    return [];
  }
}

// Un cambio manual dura hasta la proxima actualizacion automatica del
// job diario (todos los dias a las 2am), que vuelve a traer el tipo de
// cambio real desde la API externa
export async function updateCurrency(id: string, price: number): Promise<boolean> {
  const res = await fetch(`${API_URL}/CurrencyData/UpdateCurrency`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, price }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || "Error actualizando el tipo de cambio.");
  }

  return res.json();
}

/* =========================
   UNIDADES
========================= */

export async function getUnits(): Promise<Unit[]> {
  try {
    const res = await fetch(
      `${API_URL}/UnitData/getUnit`,
      {
        credentials: "include",
      }
    );

    if (!res.ok) {
      throw new Error("Error al obtener unidades");
    }

    return await res.json();
  } catch {

    return [];
  }
}

export async function createUnit(
  unit: Omit<Unit, "id">
): Promise<boolean> {
  try {
    const res = await fetch(
      `${API_URL}/UnitData/createUnit`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(unit),
      }
    );
    if (!res.ok) {

    const error = await res.text();

    throw new Error(error || "Error creando el material.");

  }

    return res.ok;
  } catch (error) {
    
    throw error;
  }
}

export async function updateUnit(
  unit: Unit
): Promise<boolean> {
  try {
    const res = await fetch(
      `${API_URL}/UnitData/editUnit`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(unit),
      }
    );

    return res.ok;
  } catch {

    return false;
  }
}

export async function deleteUnit(
  id: number
): Promise<boolean> {
  try {
    const res = await fetch(
      `${API_URL}/UnitData/deleteUnit/?id=${id}`,
      {
        method: "DELETE",
        credentials: "include",
      }
    );
    if (!res.ok) {

    const error = await res.text();

    throw new Error(error || "Error creando el material.");

  }

    return res.ok;
  } catch (error) {
    
    throw error;
  }
}
/* =========================
   Clasificadores
========================= */

export async function getClassify(): Promise<Classify[]> {
  try {
    const res = await fetch(
      `${API_URL}/ClassifyData/getClassify`,
      {
        credentials: "include",
      }
    );

    if (!res.ok) {
      throw new Error("Error al obtener clasificadores");
    }

    return await res.json();
  } catch {

    return [];
  }
}

export async function createclassify(
  classify: Omit<Classify, "id">
): Promise<boolean> {
  try {
    const res = await fetch(
      `${API_URL}/ClassifyData/createClassify`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(classify),
      }
    );
    if (!res.ok) {

    const error = await res.text();

    throw new Error(error || "Error creando el material.");

  }

    return res.ok;
  } catch (error) {
    
    throw error;
  }
}

export async function updateclassify(
  classify: Classify
): Promise<boolean> {
  try {
    const res = await fetch(
      `${API_URL}/ClassifyData/editClassify`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(classify),
      }
    );

    return res.ok;
  } catch {

    return false;
  }
}

export async function deleteClassify(
  id: number
): Promise<boolean> {
  try {
    const res = await fetch(
      `${API_URL}/ClassifyData/deleteClassify/?id=${id}`,
      {
        method: "DELETE",
        credentials: "include",
      }
    );
    if (!res.ok) {

    const error = await res.text();

    throw new Error(error || "Error creando el material.");

  }

    return res.ok;
  } catch (error) {
    
    throw error;
  }
}

/* =========================
   Physical State
========================= */

export async function getPhysicalState(): Promise<PhysicalState[]> {
  try {
    const res = await fetch(
      `${API_URL}/PhysicalStateData/getPhysicalState`,
      {
        credentials: "include",
      }
    );

    if (!res.ok) {
      throw new Error("Error al obtener estados físicos");
    }

    return await res.json();
  } catch {

    return [];
  }
}

export async function createPhysicalState(
  physicalState: Omit<PhysicalState, "id">
): Promise<boolean> {
  try {
    const res = await fetch(
      `${API_URL}/PhysicalStateData/createPhysicalState`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(physicalState),
      }
    );
    if (!res.ok) {

    const error = await res.text();

    throw new Error(error || "Error creando el material.");

  }

    return res.ok;
  } catch (error) {
    
    throw error;
  }
}

export async function updatePhysicalState(
  physicalState: PhysicalState
): Promise<boolean> {
  try {
    const res = await fetch(
      `${API_URL}/PhysicalStateData/editPhysicalState`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(physicalState),
      }
    );

    return res.ok;
  } catch {

    return false;
  }
}

export async function deletePhysicalState(
  id: number
): Promise<boolean> {
  const res = await fetch(
    `${API_URL}/PhysicalStateData/deletePhysicalState/?id=${id}`,
    {
      method: "DELETE",
      credentials: "include",
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Error al eliminar el estado físico.");
  }

  return res.ok;
}


export async function getMaterials(): Promise<Material[]> {
  const response = await fetch(`${API_URL}/MaterialsData/getMaterials`, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Error obteniendo materiales");
  }

  return response.json();
}

export async function createMaterial(material: Omit<Material, "id">) {
  const response = await fetch(`${API_URL}/MaterialsData/createMaterials`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(material),
  });

  if (!response.ok) {

    const error = await response.text();

    throw new Error(error || "Error creando el material.");

  }

  return await response.json();

}

export const deleteMaterial = async (id: number) => {
  const res = await fetch(`${API_URL}/MaterialsData/deleteMaterials?id=${id}`, {
    method: "DELETE",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error("Error eliminando material");
  }

  return true;
};

export const updateMaterial = async (payload: Material) => {
    const res = await fetch(`${API_URL}/MaterialsData/editMaterials`, {
        method: "PUT",
        credentials: "include",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error("Error actualizando material");

    return res.json();
};
