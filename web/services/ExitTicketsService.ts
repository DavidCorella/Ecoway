import { API_URL } from "./config";
import { PagedResult } from "./pagination";

// De cual acta de entrada (y cuanto de esa acta puntual) salio el
// material reservado. Una sola linea de salida puede juntar material de
// varias actas de entrada distintas (se reserva de las mas viejas primero)
export interface MaterialAllocationSource {
  ticket_id: string;
  ticket_number: string;
  ticket_date: string;
  company_name: string;
  quantity_kg: number;
}

export interface ExitTicketItem {
  id?: string;
  material_description: string;
  quantity_kg: number;
  physical_state: string | null;
  // Se llena una sola vez al marcar el material como gestionado
  management_date?: string | null;
  // Solo viene en GetExitTicket (detalle de una acta), no en el listado
  sources?: MaterialAllocationSource[];
}

export interface ExitTicket {
  id: string;
  exit_ticket_number: string;
  destination_company_id: string;
  destination_company_name: string;
  exit_date: string;
  receiver_responsible_name: string;
  receiver_responsible_id: string;
  ecoway_responsible_name: string;
  ecoway_responsible_id: string;
  image_path: string;
  status: "Active" | "Voided";
  void_reason: string | null;
  version: number;
  created_at: string;
  updated_at: string | null;
  total_kg: number;
  items: ExitTicketItem[];
}

// Una fila por material de un acta de salida activa, para la pantalla de
// Estado de actas de salida (gestion por material). Las actas anuladas no
// vienen en esta lista
export interface ExitTicketItemManagement {
  id: string;
  exit_ticket_id: string;
  exit_ticket_number: string;
  destination_company_name: string;
  exit_date: string;
  receiver_responsible_name: string;
  receiver_responsible_id: string;
  ecoway_responsible_name: string;
  ecoway_responsible_id: string;
  image_path: string;
  material_description: string;
  quantity_kg: number;
  physical_state: string | null;
  management_date: string | null;
  // Plazo del material en el catalogo, contado desde exit_date. Null si el
  // material no esta en el catalogo (o esta pero sin plazo definido)
  max_management_days: number | null;
}

export interface ExitTicketFormInput {
  id?: string;
  exit_ticket_number: string;
  destination_company_id: string;
  exit_date: string;
  receiver_responsible_name: string;
  receiver_responsible_id: string;
  ecoway_responsible_name: string;
  ecoway_responsible_id: string;
  image_path: string;
  items: ExitTicketItem[];
}

const handleResponse = async <T>(res: Response): Promise<T> => {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Error en API");
  }
  return res.json();
};

export interface ExitTicketsQuery {
  search?: string;
  status?: string;
  processed?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

// El filtro y la busqueda se resuelven en el servidor, la tabla solo
// pide la pagina que se esta viendo
export const getExitTickets = async (query: ExitTicketsQuery): Promise<PagedResult<ExitTicket>> => {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.status) params.set("status", query.status);
  if (query.processed) params.set("processed", query.processed);
  if (query.dateFrom) params.set("dateFrom", query.dateFrom);
  if (query.dateTo) params.set("dateTo", query.dateTo);
  params.set("page", String(query.page ?? 1));
  params.set("pageSize", String(query.pageSize ?? 25));

  const res = await fetch(`${API_URL}/ExitTicketsData/GetExitTickets?${params.toString()}`, {
    credentials: "include",
  });
  return handleResponse<PagedResult<ExitTicket>>(res);
};

export const getExitTicket = async (id: string): Promise<ExitTicket> => {
  const res = await fetch(`${API_URL}/ExitTicketsData/GetExitTicket?id=${id}`, {
    credentials: "include",
  });
  return handleResponse<ExitTicket>(res);
};

export const createExitTicket = async (input: ExitTicketFormInput) => {
  const res = await fetch(`${API_URL}/ExitTicketsData/CreateExitTicket`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return handleResponse<ExitTicket>(res);
};

export const editExitTicket = async (input: ExitTicketFormInput) => {
  const res = await fetch(`${API_URL}/ExitTicketsData/EditExitTicket`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return handleResponse<boolean>(res);
};

export const voidExitTicket = async (id: string, reason: string) => {
  const res = await fetch(`${API_URL}/ExitTicketsData/VoidExitTicket`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, reason }),
  });
  return handleResponse<boolean>(res);
};

export const reactivateExitTicket = async (id: string) => {
  const res = await fetch(`${API_URL}/ExitTicketsData/ReactivateExitTicket?id=${id}`, {
    method: "PUT",
    credentials: "include",
  });
  return handleResponse<boolean>(res);
};

// ---------------------------------------------------------------------
// ESTADO DE ACTAS DE SALIDA (gestion por material)
// ---------------------------------------------------------------------

export interface ExitTicketItemsManagementQuery {
  search?: string;
  management?: string;
  minDays?: number;
  // Solo materiales que ya pasaron su plazo del catalogo (dias de gestion
  // en negativo), sin importar minDays
  onlyOverdue?: boolean;
  page?: number;
  pageSize?: number;
}

export const getExitTicketItemsManagement = async (
  query: ExitTicketItemsManagementQuery
): Promise<PagedResult<ExitTicketItemManagement>> => {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.management) params.set("management", query.management);
  if (query.minDays !== undefined && query.minDays !== null) params.set("minDays", String(query.minDays));
  if (query.onlyOverdue) params.set("onlyOverdue", "true");
  params.set("page", String(query.page ?? 1));
  params.set("pageSize", String(query.pageSize ?? 25));

  const res = await fetch(`${API_URL}/ExitTicketsData/GetExitTicketItemsManagement?${params.toString()}`, {
    credentials: "include",
  });
  return handleResponse<PagedResult<ExitTicketItemManagement>>(res);
};

// Una sola vez: si el material ya tiene fecha de gestion, no se puede
// volver a marcar
export const markExitTicketItemAsManaged = async (id: string) => {
  const res = await fetch(`${API_URL}/ExitTicketsData/MarkItemAsManaged?id=${id}`, {
    method: "PUT",
    credentials: "include",
  });
  return handleResponse<boolean>(res);
};

export const uploadExitTicketImage = async (
  file: File
): Promise<{ fileName: string }> => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_URL}/ExitTicketsData/UploadImage`, {
    method: "POST",
    credentials: "include",
    // el backend exige esta cabecera (RequireAjaxRequestAttribute) porque
    // un formulario HTML no la puede agregar
    headers: { "X-Requested-With": "XMLHttpRequest" },
    body: formData,
  });

  return handleResponse<{ fileName: string }>(res);
};

// El img manda la cookie de sesion solo, no hace falta traerla como blob
export const exitTicketImageUrl = (fileName: string) =>
  `${API_URL}/ExitTicketsData/GetImage/${fileName}`;
