import { API_URL } from "./config";
import { PagedResult } from "./pagination";

export interface Company {
  id: string;
  nombre_comercial: string;
  razon_social: string;
  cedula_juridica: string;
  address: string;
  contact_name: string;
  // cedula fisica de la persona de contacto, distinta de cedula_juridica
  contact_id: string;
  // cargo del contacto en la empresa
  contact_position: string;
  contact_phone: string;
  contact_cell: string;
  email: string;
  // No todas las empresas tienen proyecto, cuando existe se muestra junto al nombre
  project: string | null;
  // Una empresa nunca se borra, solo se inactiva
  is_active: boolean;
}

export interface CompanyFormInput {
  id?: string;
  nombre_comercial: string;
  razon_social: string;
  cedula_juridica: string;
  address: string;
  contact_name: string;
  contact_id: string;
  contact_position: string;
  contact_phone: string;
  contact_cell: string;
  email: string;
  project?: string;
}

export interface TicketItem {
  id?: string;
  material_description: string;
  quantity_kg: number;
  physical_state: string | null;
}

export interface Ticket {
  id: string;
  ticket_number: string;
  company_id: string;
  company_name: string;
  ticket_date: string;
  client_responsible_name: string;
  client_responsible_id: string;
  ecoway_responsible_name: string;
  ecoway_responsible_id: string;
  image_path: string;
  // Cuantos viajes de flete hizo falta para recolectar esta acta. Se usa
  // para sugerir fletes (sin precio) al armar el Resumen de Recolección
  freight_count: number;
  status: "Active" | "Voided";
  void_reason: string | null;
  // Se marca a mano desde la lista, una sola vez (no se desmarca)
  invoiced: boolean;
  version: number;
  created_at: string;
  updated_at: string | null;
  total_kg: number;
  items: TicketItem[];
}

// Un corte del historial de procesamiento parcial de una linea de acta
export interface TicketItemProcessing {
  id: string;
  quantity_kg: number;
  processed_at: string;
}

// Una fila por material de un acta activa, para la pantalla de Estado de
// actas de entrada (gestion por material). Las actas anuladas no vienen
// en esta lista
export interface TicketItemManagement {
  id: string;
  ticket_id: string;
  ticket_number: string;
  company_name: string;
  ticket_date: string;
  client_responsible_name: string;
  client_responsible_id: string;
  ecoway_responsible_name: string;
  ecoway_responsible_id: string;
  image_path: string;
  material_description: string;
  quantity_kg: number;
  physical_state: string | null;

  // Cuanto de este material ya se saco en actas de salida (se reserva de
  // las actas de entrada mas viejas primero). Es informativo nada mas: un
  // material se puede procesar sin pasar por una boleta de salida formal
  consumed_kg: number;
  // "Pendiente" o "Procesada". Procesada cuando processed_kg + consumed_kg
  // llega a quantity_kg (procesando a mano, por actas de salida, o ambos)
  status: "Pendiente" | "Procesada";
  // Fecha en que se completo el procesamiento. Null mientras este Pendiente
  processed_at: string | null;
  // Cuanto de este material ya se proceso a mano en total (suma de
  // processings). Puede ser parcial, sin llegar todavia a quantity_kg
  processed_kg: number;
  // Historial completo: una fila por cada vez que se proceso una
  // cantidad de esta linea, mas vieja primero
  processings: TicketItemProcessing[];

  // Plazo del material en el catalogo. Null si el material no esta en el
  // catalogo (o esta pero sin plazo definido)
  max_management_days: number | null;
}

// Cuanto queda disponible de un material en el inventario de entrada
// (recolectado en actas activas, menos lo ya reservado en actas de
// salida). Se usa al armar una acta de salida
export interface AvailableMaterial {
  material_description: string;
  available_kg: number;
  // Estado fisico de la boleta de entrada mas vieja con disponible. Viene
  // de ahi y no del catalogo de materiales, que puede no tener una ficha
  // exacta para lo que se recolecto
  physical_state: string | null;
}

const handleResponse = async <T>(res: Response): Promise<T> => {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Error en API");
  }
  return res.json();
};

// ---------------------------------------------------------------------
// EMPRESAS
// ---------------------------------------------------------------------

export const getCompanies = async (): Promise<Company[]> => {
  const res = await fetch(`${API_URL}/CompanyData/GetCompanies`, {
    credentials: "include",
  });
  return handleResponse<Company[]>(res);
};

export interface CompaniesQuery {
  search?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export const getCompaniesPaged = async (query: CompaniesQuery): Promise<PagedResult<Company>> => {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.status) params.set("status", query.status);
  params.set("page", String(query.page ?? 1));
  params.set("pageSize", String(query.pageSize ?? 25));

  const res = await fetch(`${API_URL}/CompanyData/GetCompaniesPaged?${params.toString()}`, {
    credentials: "include",
  });
  return handleResponse<PagedResult<Company>>(res);
};

export const createCompany = async (input: CompanyFormInput) => {
  const res = await fetch(`${API_URL}/CompanyData/CreateCompany`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return handleResponse<boolean>(res);
};

export const editCompany = async (input: CompanyFormInput) => {
  const res = await fetch(`${API_URL}/CompanyData/EditCompany`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return handleResponse<boolean>(res);
};

// Una empresa nunca se borra, solo se activa o inactiva
export const updateCompanyStatus = async (id: string, status: boolean) => {
  const res = await fetch(
    `${API_URL}/CompanyData/UpdateStatusCompany?id=${id}&status=${status}`,
    { method: "PUT", credentials: "include" }
  );
  return handleResponse<boolean>(res);
};

// ---------------------------------------------------------------------
// ACTAS (TICKETS)
// ---------------------------------------------------------------------

export const getTickets = async (): Promise<Ticket[]> => {
  const res = await fetch(`${API_URL}/TicketsData/GetTickets`, {
    credentials: "include",
  });
  return handleResponse<Ticket[]>(res);
};

export interface TicketsQuery {
  search?: string;
  status?: string;
  invoiced?: boolean;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

// Version paginada: el filtro y la busqueda se resuelven en el servidor,
// asi que la tabla no necesita traer todas las actas para mostrar una pagina
export const getTicketsPaged = async (query: TicketsQuery): Promise<PagedResult<Ticket>> => {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.status) params.set("status", query.status);
  if (query.invoiced !== undefined) params.set("invoiced", String(query.invoiced));
  if (query.dateFrom) params.set("dateFrom", query.dateFrom);
  if (query.dateTo) params.set("dateTo", query.dateTo);
  params.set("page", String(query.page ?? 1));
  params.set("pageSize", String(query.pageSize ?? 25));

  const res = await fetch(`${API_URL}/TicketsData/GetTicketsPaged?${params.toString()}`, {
    credentials: "include",
  });
  return handleResponse<PagedResult<Ticket>>(res);
};

export const getTicket = async (id: string): Promise<Ticket> => {
  const res = await fetch(`${API_URL}/TicketsData/GetTicket?id=${id}`, {
    credentials: "include",
  });
  return handleResponse<Ticket>(res);
};

export interface TicketFormInput {
  id?: string;
  ticket_number: string;
  company_id: string;
  ticket_date: string;
  client_responsible_name: string;
  client_responsible_id: string;
  ecoway_responsible_name: string;
  ecoway_responsible_id: string;
  image_path: string;
  freight_count: number;
  items: TicketItem[];
}

export const createTicket = async (input: TicketFormInput) => {
  const res = await fetch(`${API_URL}/TicketsData/CreateTicket`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return handleResponse<Ticket>(res);
};

export const editTicket = async (input: TicketFormInput) => {
  const res = await fetch(`${API_URL}/TicketsData/EditTicket`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return handleResponse<boolean>(res);
};

export const voidTicket = async (id: string, reason: string) => {
  const res = await fetch(`${API_URL}/TicketsData/VoidTicket`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, reason }),
  });
  return handleResponse<boolean>(res);
};

export const reactivateTicket = async (id: string) => {
  const res = await fetch(`${API_URL}/TicketsData/ReactivateTicket?id=${id}`, {
    method: "PUT",
    credentials: "include",
  });
  return handleResponse<boolean>(res);
};

// Una sola vez: si el acta ya esta facturada, no se puede volver a marcar
export const markTicketAsInvoiced = async (id: string) => {
  const res = await fetch(`${API_URL}/TicketsData/MarkTicketAsInvoiced?id=${id}`, {
    method: "PUT",
    credentials: "include",
  });
  return handleResponse<boolean>(res);
};

// ---------------------------------------------------------------------
// ESTADO DE ACTAS DE ENTRADA (gestion por material)
// ---------------------------------------------------------------------

export interface TicketItemsManagementQuery {
  search?: string;
  management?: string;
  minDays?: number;
  // Solo materiales que ya pasaron su plazo del catalogo (dias de gestion
  // en negativo), sin importar minDays
  onlyOverdue?: boolean;
  page?: number;
  pageSize?: number;
}

export const getTicketItemsManagement = async (
  query: TicketItemsManagementQuery
): Promise<PagedResult<TicketItemManagement>> => {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.management) params.set("management", query.management);
  if (query.minDays !== undefined && query.minDays !== null) params.set("minDays", String(query.minDays));
  if (query.onlyOverdue) params.set("onlyOverdue", "true");
  params.set("page", String(query.page ?? 1));
  params.set("pageSize", String(query.pageSize ?? 25));

  const res = await fetch(`${API_URL}/TicketsData/GetTicketItemsManagement?${params.toString()}`, {
    credentials: "include",
  });
  return handleResponse<PagedResult<TicketItemManagement>>(res);
};

// Procesa una cantidad (puede ser parcial) de una linea. Se puede llamar
// varias veces hasta completar el total de esa linea
export const processTicketItemQuantity = async (id: string, quantityKg: number) => {
  const res = await fetch(
    `${API_URL}/TicketsData/ProcessItemQuantity?id=${id}&quantityKg=${quantityKg}`,
    { method: "PUT", credentials: "include" }
  );
  return handleResponse<boolean>(res);
};

// ---------------------------------------------------------------------
// INVENTARIO DE ENTRADA (para armar actas de salida)
// ---------------------------------------------------------------------

export const getAvailableInventory = async (): Promise<AvailableMaterial[]> => {
  const res = await fetch(`${API_URL}/TicketsData/GetAvailableInventory`, {
    credentials: "include",
  });
  return handleResponse<AvailableMaterial[]>(res);
};

export const uploadTicketImage = async (
  file: File
): Promise<{ fileName: string }> => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_URL}/TicketsData/UploadImage`, {
    method: "POST",
    credentials: "include",
    // esta cabecera la pide el backend (RequireAjaxRequestAttribute), un
    // formulario HTML no la puede mandar
    headers: { "X-Requested-With": "XMLHttpRequest" },
    body: formData,
  });

  return handleResponse<{ fileName: string }>(res);
};

// El img manda la cookie de sesion solo, no hace falta traerla como blob
export const ticketImageUrl = (fileName: string) =>
  `${API_URL}/TicketsData/GetImage/${fileName}`;
