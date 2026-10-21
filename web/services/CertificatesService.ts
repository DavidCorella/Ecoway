import { API_URL } from "./config";
import { PagedResult } from "./pagination";

export interface CertificateItem {
  id?: string;
  material_description: string;
  quantity_kg: number;
}

export interface Certificate {
  id: string;
  certificate_number: string;

  company_id: string;
  company_name: string;
  company_address: string | null;

  // Obligatorios: el backend los exige siempre (columnas NOT NULL)
  contact_name: string;
  contact_position: string;
  contact_phone: string;
  contact_cell: string;
  contact_email: string;

  certificate_date_from: string;
  certificate_date_to: string;
  issued_date: string;

  // Fijos, el firmante siempre es la misma persona
  signer_name: string;
  signer_position: string;

  status: "Active" | "Voided";
  void_reason: string | null;
  version: number;
  created_at: string;
  updated_at: string | null;
  // Quien genero el certificado, distinto del firmante fijo
  created_by_display: string | null;

  total_kg: number;
  ticket_ids: string[];
  ticket_numbers: string[];
  items: CertificateItem[];
}

export interface CertificateFormInput {
  id?: string;
  certificate_number: string;
  company_id: string;

  contact_name: string;
  contact_position: string;
  contact_phone: string;
  contact_cell: string;
  contact_email: string;

  certificate_date_from: string;
  certificate_date_to: string;
  issued_date: string;

  ticket_ids: string[];
  items: CertificateItem[];
}

const handleResponse = async <T>(res: Response): Promise<T> => {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Error en API");
  }
  return res.json();
};

export interface CertificatesQuery {
  search?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

export const getCertificates = async (query: CertificatesQuery): Promise<PagedResult<Certificate>> => {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.status) params.set("status", query.status);
  if (query.dateFrom) params.set("dateFrom", query.dateFrom);
  if (query.dateTo) params.set("dateTo", query.dateTo);
  params.set("page", String(query.page ?? 1));
  params.set("pageSize", String(query.pageSize ?? 25));

  const res = await fetch(`${API_URL}/CertificatesData/GetCertificates?${params.toString()}`, {
    credentials: "include",
  });
  return handleResponse<PagedResult<Certificate>>(res);
};

export const getCertificate = async (id: string): Promise<Certificate> => {
  const res = await fetch(`${API_URL}/CertificatesData/GetCertificate?id=${id}`, {
    credentials: "include",
  });
  return handleResponse<Certificate>(res);
};

// Sugerencia de numero, el campo se puede editar igual a mano
export const getNextCertificateNumber = async (): Promise<string> => {
  const res = await fetch(`${API_URL}/CertificatesData/NextNumber`, {
    credentials: "include",
  });
  const data = await handleResponse<{ number: string }>(res);
  return data.number;
};

export const createCertificate = async (input: CertificateFormInput) => {
  const res = await fetch(`${API_URL}/CertificatesData/CreateCertificate`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return handleResponse<Certificate>(res);
};

export const editCertificate = async (input: CertificateFormInput) => {
  const res = await fetch(`${API_URL}/CertificatesData/EditCertificate`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return handleResponse<boolean>(res);
};

export const voidCertificate = async (id: string, reason: string) => {
  const res = await fetch(`${API_URL}/CertificatesData/VoidCertificate`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, reason }),
  });
  return handleResponse<boolean>(res);
};
