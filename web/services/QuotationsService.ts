import { API_URL } from "./config";
import { PagedResult } from "./pagination";

export interface QuotationItem {
  id?: string;
  material_description: string;
  quantity_kg: number;
  cost: number;
  // Solo para calcular "cost" en el formulario, no sale impreso en la
  // cotizacion final (el PDF solo muestra el costo ya calculado)
  price_per_kg?: number | null;
  // Nota libre por linea, opcional
  comment?: string | null;
}

// Un flete de la cotizacion, puede haber varios y cada uno con su propio costo
export interface QuotationFreight {
  id?: string;
  // Cuantos fletes de este tipo (ej. 3 viajes en camion)
  quantity: number;
  // Costo de CADA flete, no el total de la linea
  cost: number;
  description?: string | null;
  // Solo en la respuesta: quantity * cost
  total?: number;
}

export interface Quotation {
  id: string;
  quotation_number: string;
  quotation_date: string;

  company_id: string;
  company_name: string;
  company_address: string | null;
  company_phone: string | null;

  // Obligatorios: el backend los exige siempre (columnas NOT NULL)
  contact_name: string;
  contact_position: string;
  contact_phone: string;
  contact_cell: string;
  contact_email: string;

  // Suma de todos los fletes, calculada por el backend
  freight_cost: number;
  tax_rate: number;
  validity_days: number;

  // service_description es el unico que puede quedar vacio
  service_description: string | null;
  delivery_condition: string;
  payment_terms: string;
  ownership_conditions: string;
  incident_responsibility: string;
  force_majeure_conditions: string;
  other_conditions: string;

  signer_name: string;
  signer_position: string;

  // Moneda en la que estan expresados los montos ("USD" o "CRC") y el
  // tipo de cambio (colones por dolar) usado al armar la cotizacion
  currency: "USD" | "CRC";
  exchange_rate: number;

  status: "Active" | "Voided";
  void_reason: string | null;
  version: number;
  created_at: string;
  updated_at: string | null;

  // Estos los calcula el backend, solo se muestran
  management_cost: number;
  subtotal: number;
  tax_amount: number;
  total: number;

  items: QuotationItem[];
  freights: QuotationFreight[];
}

export interface QuotationFormInput {
  id?: string;
  quotation_number: string;
  quotation_date: string;
  company_id: string;

  contact_name: string;
  contact_position: string;
  contact_phone: string;
  contact_cell: string;
  contact_email: string;

  tax_rate: number;
  validity_days: number;

  // service_description es el unico que puede quedar vacio
  service_description?: string;
  delivery_condition: string;
  payment_terms: string;
  ownership_conditions: string;
  incident_responsibility: string;
  force_majeure_conditions: string;
  other_conditions: string;

  signer_name: string;
  signer_position: string;

  currency: "USD" | "CRC";
  exchange_rate: number;

  items: QuotationItem[];
  freights: QuotationFreight[];
}

const handleResponse = async <T>(res: Response): Promise<T> => {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Error en API");
  }
  return res.json();
};

export interface QuotationsQuery {
  search?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

export const getQuotations = async (query: QuotationsQuery): Promise<PagedResult<Quotation>> => {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.status) params.set("status", query.status);
  if (query.dateFrom) params.set("dateFrom", query.dateFrom);
  if (query.dateTo) params.set("dateTo", query.dateTo);
  params.set("page", String(query.page ?? 1));
  params.set("pageSize", String(query.pageSize ?? 25));

  const res = await fetch(`${API_URL}/QuotationsData/GetQuotations?${params.toString()}`, {
    credentials: "include",
  });
  return handleResponse<PagedResult<Quotation>>(res);
};

export const getQuotation = async (id: string): Promise<Quotation> => {
  const res = await fetch(`${API_URL}/QuotationsData/GetQuotation?id=${id}`, {
    credentials: "include",
  });
  return handleResponse<Quotation>(res);
};

// Sugerencia de numero, el campo se puede editar igual a mano
export const getNextQuotationNumber = async (): Promise<string> => {
  const res = await fetch(`${API_URL}/QuotationsData/NextNumber`, {
    credentials: "include",
  });
  const data = await handleResponse<{ number: string }>(res);
  return data.number;
};

// Terminos y condiciones de la ultima cotizacion, para precargar el formulario
export const getLatestQuotationTerms = async (): Promise<Quotation | null> => {
  const res = await fetch(`${API_URL}/QuotationsData/LatestTerms`, {
    credentials: "include",
  });
  if (res.status === 200) {
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  }
  return handleResponse<Quotation | null>(res);
};

// Trae el contacto de la ultima cotizacion de esa empresa, para sugerirlo
export const getLatestQuotationByCompany = async (
  companyId: string
): Promise<Quotation | null> => {
  const res = await fetch(`${API_URL}/QuotationsData/LatestByCompany?companyId=${companyId}`, {
    credentials: "include",
  });
  if (res.status === 200) {
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  }
  return handleResponse<Quotation | null>(res);
};

export interface MaterialPriceHistory {
  material_description: string;
  price_per_kg: number;
  currency: "USD" | "CRC";
}

// ultimo precio por kilo cobrado a esa empresa por cada material,
// revisando todo su historial y no solo la ultima cotizacion
export const getMaterialPriceHistory = async (
  companyId: string
): Promise<MaterialPriceHistory[]> => {
  const res = await fetch(`${API_URL}/QuotationsData/MaterialPriceHistory?companyId=${companyId}`, {
    credentials: "include",
  });
  return handleResponse<MaterialPriceHistory[]>(res);
};

export const createQuotation = async (input: QuotationFormInput) => {
  const res = await fetch(`${API_URL}/QuotationsData/CreateQuotation`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return handleResponse<Quotation>(res);
};

export const editQuotation = async (input: QuotationFormInput) => {
  const res = await fetch(`${API_URL}/QuotationsData/EditQuotation`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return handleResponse<boolean>(res);
};

export const voidQuotation = async (id: string, reason: string) => {
  const res = await fetch(`${API_URL}/QuotationsData/VoidQuotation`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, reason }),
  });
  return handleResponse<boolean>(res);
};
