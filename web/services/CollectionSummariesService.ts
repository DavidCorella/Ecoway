import { API_URL } from "./config";
import { PagedResult } from "./pagination";

// Una columna de la matriz, una acta incluida en el resumen
export interface CollectionSummaryTicketInfo {
  ticket_id: string;
  ticket_number: string;
  ticket_date: string;
}

// Una fila de la matriz, un material con su precio y los kilos por acta
// en el mismo orden que tickets
export interface CollectionSummaryMaterialPrice {
  material_description: string;
  price_per_kg: number;
  // Nota libre por material, opcional, sale en el PDF/Excel como "Notas"
  comment: string | null;
  total_kg: number;
  kg_by_ticket: number[];
}

// Un flete del resumen: uno por cada acta de entrada marcada que trae
// viajes registrados. La acta es la guia, la cantidad la calcula el
// servidor a partir de su freight_count, no se manda ni se edita a mano
export interface CollectionSummaryFreight {
  id?: string;
  // A que acta pertenece. Null en fletes viejos, de antes de este campo
  ticket_id?: string | null;
  ticket_number?: string | null;
  // Cuantos fletes de este tipo (ej. 3 viajes en camion): solo lectura,
  // lo calcula el servidor
  quantity?: number;
  // Costo de CADA flete, no el total de la linea
  cost: number;
  description?: string | null;
  // quantity * cost, calculado (solo en la respuesta)
  total?: number;
}

export interface CollectionSummary {
  id: string;
  summary_number: string;

  company_id: string;
  company_name: string;
  company_address: string | null;

  date_from: string;
  date_to: string;
  period_label: string;

  // Obligatorios: el backend los exige siempre (columnas NOT NULL)
  contact_name: string;
  contact_position: string;
  contact_phone: string;
  contact_cell: string;
  contact_email: string;

  // Precio promedio por flete, solo para mostrar en reportes con un solo
  // precio. El detalle real de cada flete viene en freights (mas abajo)
  freight_price: number;
  freight_count: number;
  tax_rate: number;

  // Moneda en la que estan expresados los montos ("USD" o "CRC") y el
  // tipo de cambio (colones por dolar) usado al armar el resumen
  currency: "USD" | "CRC";
  exchange_rate: number;

  status: "Active" | "Voided";
  void_reason: string | null;
  version: number;
  created_at: string;
  updated_at: string | null;

  tickets: CollectionSummaryTicketInfo[];
  materials: CollectionSummaryMaterialPrice[];
  freights: CollectionSummaryFreight[];

  // Estos los calcula el backend, solo se muestran, no se editan directo
  total_kg: number;
  materials_total: number;
  freight_total: number;
  subtotal: number;
  tax_amount: number;
  total: number;
}

export interface CollectionSummaryMaterialPriceInput {
  material_description: string;
  price_per_kg: number;
  comment?: string;
}

export interface CollectionSummaryFormInput {
  id?: string;
  summary_number: string;
  company_id: string;

  date_from: string;
  date_to: string;
  period_label: string;

  contact_name: string;
  contact_position: string;
  contact_phone: string;
  contact_cell: string;
  contact_email: string;

  tax_rate: number;

  currency: "USD" | "CRC";
  exchange_rate: number;

  ticket_ids: string[];
  material_prices: CollectionSummaryMaterialPriceInput[];
  freights: CollectionSummaryFreight[];
}

const handleResponse = async <T>(res: Response): Promise<T> => {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Error en API");
  }
  return res.json();
};

export interface SummariesQuery {
  search?: string;
  status?: string;
  periodFrom?: string;
  periodTo?: string;
  page?: number;
  pageSize?: number;
}

export const getSummaries = async (query: SummariesQuery): Promise<PagedResult<CollectionSummary>> => {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.status) params.set("status", query.status);
  if (query.periodFrom) params.set("periodFrom", query.periodFrom);
  if (query.periodTo) params.set("periodTo", query.periodTo);
  params.set("page", String(query.page ?? 1));
  params.set("pageSize", String(query.pageSize ?? 25));

  const res = await fetch(`${API_URL}/CollectionSummariesData/GetSummaries?${params.toString()}`, {
    credentials: "include",
  });
  return handleResponse<PagedResult<CollectionSummary>>(res);
};

export const getSummary = async (id: string): Promise<CollectionSummary> => {
  const res = await fetch(`${API_URL}/CollectionSummariesData/GetSummary?id=${id}`, {
    credentials: "include",
  });
  return handleResponse<CollectionSummary>(res);
};

// Sugerencia de numero, no se muestra en el formulario, viaja oculto
export const getNextSummaryNumber = async (): Promise<string> => {
  const res = await fetch(`${API_URL}/CollectionSummariesData/NextNumber`, {
    credentials: "include",
  });
  const data = await handleResponse<{ number: string }>(res);
  return data.number;
};

// Trae contacto, flete y precios del ultimo resumen de esa empresa, para sugerirlos
export const getLatestSummaryByCompany = async (
  companyId: string
): Promise<CollectionSummary | null> => {
  const res = await fetch(`${API_URL}/CollectionSummariesData/LatestByCompany?companyId=${companyId}`, {
    credentials: "include",
  });
  if (res.status === 200) {
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  }
  return handleResponse<CollectionSummary | null>(res);
};

export const createSummary = async (input: CollectionSummaryFormInput) => {
  const res = await fetch(`${API_URL}/CollectionSummariesData/CreateSummary`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return handleResponse<CollectionSummary>(res);
};

export const editSummary = async (input: CollectionSummaryFormInput) => {
  const res = await fetch(`${API_URL}/CollectionSummariesData/EditSummary`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return handleResponse<boolean>(res);
};

export const voidSummary = async (id: string, reason: string) => {
  const res = await fetch(`${API_URL}/CollectionSummariesData/VoidSummary`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, reason }),
  });
  return handleResponse<boolean>(res);
};
