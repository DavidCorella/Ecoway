import { API_URL } from "./config";
import { PagedResult } from "./pagination";

export interface AuditLogEntry {
  id: string;
  created_at: string;
  user_display: string | null;
  action: string;
  detail: string | null;
}

export interface ErrorLogEntry {
  id: string;
  created_at: string;
  message: string;
  source: string | null;
  status_code: number | null;
}

const handleResponse = async <T>(res: Response): Promise<T> => {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Error en API");
  }
  return res.json();
};

export interface AuditLogsQuery {
  search?: string;
  action?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

export const getAuditLogs = async (
  query: AuditLogsQuery
): Promise<PagedResult<AuditLogEntry>> => {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.action) params.set("action", query.action);
  if (query.dateFrom) params.set("dateFrom", query.dateFrom);
  if (query.dateTo) params.set("dateTo", query.dateTo);
  params.set("page", String(query.page ?? 1));
  params.set("pageSize", String(query.pageSize ?? 25));

  const res = await fetch(
    `${API_URL}/LogsData/GetAuditLogs?${params.toString()}`,
    { credentials: "include" }
  );

  return handleResponse<PagedResult<AuditLogEntry>>(res);
};

export interface ErrorLogsQuery {
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

export const getErrorLogs = async (
  query: ErrorLogsQuery
): Promise<PagedResult<ErrorLogEntry>> => {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.dateFrom) params.set("dateFrom", query.dateFrom);
  if (query.dateTo) params.set("dateTo", query.dateTo);
  params.set("page", String(query.page ?? 1));
  params.set("pageSize", String(query.pageSize ?? 25));

  const res = await fetch(
    `${API_URL}/LogsData/GetErrorLogs?${params.toString()}`,
    { credentials: "include" }
  );

  return handleResponse<PagedResult<ErrorLogEntry>>(res);
};
