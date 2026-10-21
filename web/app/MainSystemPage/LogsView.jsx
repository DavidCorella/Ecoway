"use client";

import { useEffect, useState } from "react";
import { ShieldAlert, RefreshCw } from "lucide-react";
import { getAuditLogs, getErrorLogs } from "../../services/LogsService";
import { showError } from "../../utils/alerts";
import Pager from "../../Components/Pager";
import { useRealtimeRefresh } from "../../hooks/useRealtimeRefresh";

const PAGE_SIZE = 25;

const ACTION_LABELS = {
  LOGIN_OK: "Inicio de sesión",
  LOGIN_FAILED: "Intento fallido",
  LOGIN_LOCKED: "Cuenta bloqueada temporalmente",
  PASSWORD_CHANGED: "Cambio de contraseña",
  PASSWORD_RESET: "Reinicio de contraseña",
  PASSWORD_RESET_REQUESTED: "Solicitud de recuperación",
  USER_CREATED: "Usuario creado",
  USER_UPDATED: "Usuario editado",
  USER_DELETED: "Usuario eliminado",
  USER_STATUS_CHANGED: "Estado de usuario",
  ROLE_CREATED: "Rol creado",
  ROLE_DELETED: "Rol eliminado",
  PERMISSIONS_UPDATED: "Permisos actualizados",
  MATERIAL_CREATED: "Material creado",
  MATERIAL_UPDATED: "Material editado",
  MATERIAL_DELETED: "Material eliminado",
  UNIT_CREATED: "Unidad creada",
  UNIT_UPDATED: "Unidad editada",
  UNIT_DELETED: "Unidad eliminada",
  CLASSIFY_CREATED: "Categoría creada",
  CLASSIFY_UPDATED: "Categoría editada",
  CLASSIFY_DELETED: "Categoría eliminada",
  PHYSICAL_STATE_CREATED: "Estado físico creado",
  PHYSICAL_STATE_UPDATED: "Estado físico editado",
  PHYSICAL_STATE_DELETED: "Estado físico eliminado",
  CURRENCY_RATES_UPDATED: "Tipos de cambio actualizados",
  COMPANY_CREATED: "Empresa creada",
  COMPANY_UPDATED: "Empresa editada",
  COMPANY_DELETED: "Empresa eliminada",
  TICKET_CREATED: "Acta de entrada creada",
  TICKET_UPDATED: "Acta de entrada editada",
  TICKET_VOIDED: "Acta de entrada anulada",
  TICKET_REACTIVATED: "Acta de entrada reactivada",
  TICKET_INVOICED: "Acta de entrada facturada",
  TICKET_IMAGE_UPLOADED: "Foto de acta de entrada subida",
  TICKET_ITEM_MANAGED: "Material de acta de entrada marcado como gestionado",
  EXIT_TICKET_CREATED: "Acta de salida creada",
  EXIT_TICKET_UPDATED: "Acta de salida editada",
  EXIT_TICKET_VOIDED: "Acta de salida anulada",
  EXIT_TICKET_REACTIVATED: "Acta de salida reactivada",
  EXIT_TICKET_IMAGE_UPLOADED: "Foto de acta de salida subida",
  EXIT_TICKET_ITEM_MANAGED: "Material de acta de salida marcado como gestionado",
  QUOTATION_CREATED: "Cotización creada",
  QUOTATION_UPDATED: "Cotización editada",
  QUOTATION_VOIDED: "Cotización anulada",
  CERTIFICATE_CREATED: "Certificado creado",
  CERTIFICATE_UPDATED: "Certificado editado",
  CERTIFICATE_VOIDED: "Certificado anulado",
  COLLECTION_SUMMARY_CREATED: "Resumen de recolección creado",
  COLLECTION_SUMMARY_UPDATED: "Resumen de recolección editado",
  COLLECTION_SUMMARY_VOIDED: "Resumen de recolección anulado",
};

const RISK_ACTIONS = new Set(["LOGIN_FAILED", "LOGIN_LOCKED", "USER_DELETED", "ROLE_DELETED", "TICKET_VOIDED", "EXIT_TICKET_VOIDED", "QUOTATION_VOIDED", "CERTIFICATE_VOIDED", "COLLECTION_SUMMARY_VOIDED"]);

function formatDate(value) {
  return new Date(value).toLocaleString("es-CR", {
    dateStyle: "short",
    timeStyle: "medium",
  });
}

export default function LogsView() {
  const [tab, setTab] = useState("audit");

  // --- Auditoría ---
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditTotalCount, setAuditTotalCount] = useState(0);
  const [auditPage, setAuditPage] = useState(1);
  const [auditLoading, setAuditLoading] = useState(true);
  const [auditSearchInput, setAuditSearchInput] = useState("");
  const [auditSearch, setAuditSearch] = useState("");

  // --- Errores del sistema ---
  const [errorLogs, setErrorLogs] = useState([]);
  const [errorTotalCount, setErrorTotalCount] = useState(0);
  const [errorPage, setErrorPage] = useState(1);
  const [errorLoading, setErrorLoading] = useState(true);
  const [errorSearchInput, setErrorSearchInput] = useState("");
  const [errorSearch, setErrorSearch] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => setAuditSearch(auditSearchInput), 400);
    return () => clearTimeout(timeout);
  }, [auditSearchInput]);

  useEffect(() => {
    const timeout = setTimeout(() => setErrorSearch(errorSearchInput), 400);
    return () => clearTimeout(timeout);
  }, [errorSearchInput]);

  useEffect(() => {
    setAuditPage(1);
  }, [auditSearch]);

  useEffect(() => {
    setErrorPage(1);
  }, [errorSearch]);

  const loadAudit = async () => {
    setAuditLoading(true);
    try {
      const data = await getAuditLogs({ search: auditSearch, page: auditPage, pageSize: PAGE_SIZE });
      setAuditLogs(data.items);
      setAuditTotalCount(data.totalCount);
    } catch {
      showError("No fue posible cargar la bitácora de auditoría.");
    } finally {
      setAuditLoading(false);
    }
  };

  const loadErrors = async () => {
    setErrorLoading(true);
    try {
      const data = await getErrorLogs({ search: errorSearch, page: errorPage, pageSize: PAGE_SIZE });
      setErrorLogs(data.items);
      setErrorTotalCount(data.totalCount);
    } catch {
      showError("No fue posible cargar el log de errores.");
    } finally {
      setErrorLoading(false);
    }
  };

  useEffect(() => {
    loadAudit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auditSearch, auditPage]);

  useEffect(() => {
    loadErrors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errorSearch, errorPage]);

  // Practicamente cualquier accion del sistema escribe un log, asi que
  // esta pantalla se mantiene al dia sola mientras esta abierta
  useRealtimeRefresh("auditLogs", loadAudit);
  useRealtimeRefresh("errorLogs", loadErrors);

  const loading = tab === "audit" ? auditLoading : errorLoading;

  const refresh = () => {
    if (tab === "audit") loadAudit();
    else loadErrors();
  };

  return (
    <div className="w-full">
      {/* ACCIONES */}
      <div className="flex flex-wrap items-center justify-end gap-3 mb-6">
        <button
          onClick={refresh}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl border border-edge bg-surface px-4 py-2.5 text-sm font-medium text-ink transition hover:bg-surface-2 disabled:opacity-60"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Actualizar
        </button>
      </div>

      {/* TABS */}
      <div className="mb-5 inline-flex rounded-xl border border-edge bg-surface p-1">
        <button
          onClick={() => setTab("audit")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            tab === "audit"
              ? "bg-logs text-white"
              : "text-ink-dim hover:text-ink"
          }`}
        >
          Auditoría
          <span className="font-data ml-2 text-xs opacity-80">{auditTotalCount}</span>
        </button>

        <button
          onClick={() => setTab("errors")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            tab === "errors"
              ? "bg-logs text-white"
              : "text-ink-dim hover:text-ink"
          }`}
        >
          Errores del sistema
          <span className="font-data ml-2 text-xs opacity-80">{errorTotalCount}</span>
        </button>
      </div>

      {/* CONTENIDO */}
      {tab === "audit" ? (
        <>
          <div className="mb-5 flex flex-wrap gap-3 rounded-2xl border border-edge bg-surface p-3">
            <input
              type="text"
              placeholder="Buscar por usuario o detalle..."
              value={auditSearchInput}
              onChange={(e) => setAuditSearchInput(e.target.value)}
              className="flex-1 min-w-[220px] rounded-xl border border-edge bg-surface-2 px-4 py-2 text-ink placeholder-ink-dim/60 focus:outline-none focus:ring-2 focus:ring-logs/40 focus:border-logs-strong transition"
            />
          </div>

          <div className="overflow-x-auto rounded-2xl border border-edge bg-surface shadow-sm">
            <table className="w-full text-ink">
              <thead className="bg-surface-2">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-ink-dim">
                  <th className="px-6 py-3.5">Fecha</th>
                  <th className="px-6 py-3.5">Usuario</th>
                  <th className="px-6 py-3.5">Acción</th>
                  <th className="px-6 py-3.5">Detalle</th>
                </tr>
              </thead>
              <tbody>
                {auditLoading ? (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-ink-dim">
                      Cargando bitácora...
                    </td>
                  </tr>
                ) : auditLogs.length > 0 ? (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="border-t border-edge transition hover:bg-surface-2/60">
                      <td className="px-6 py-3.5 font-data text-sm text-ink-dim whitespace-nowrap">
                        {formatDate(log.created_at)}
                      </td>
                      <td className="px-6 py-3.5 font-data text-sm">
                        {log.user_display || "—"}
                      </td>
                      <td className="px-6 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                            RISK_ACTIONS.has(log.action)
                              ? "bg-danger-soft text-danger"
                              : "bg-logs-soft text-logs-strong"
                          }`}
                        >
                          {RISK_ACTIONS.has(log.action) && <ShieldAlert size={12} />}
                          {ACTION_LABELS[log.action] || log.action}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-ink-dim max-w-[320px] truncate" title={log.detail || ""}>
                        {log.detail || "—"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-ink-dim">
                      No hay actividad registrada todavía.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <Pager page={auditPage} pageSize={PAGE_SIZE} totalCount={auditTotalCount} onPageChange={setAuditPage} />
          </div>
        </>
      ) : (
        <>
          <div className="mb-5 flex flex-wrap gap-3 rounded-2xl border border-edge bg-surface p-3">
            <input
              type="text"
              placeholder="Buscar por mensaje u origen..."
              value={errorSearchInput}
              onChange={(e) => setErrorSearchInput(e.target.value)}
              className="flex-1 min-w-[220px] rounded-xl border border-edge bg-surface-2 px-4 py-2 text-ink placeholder-ink-dim/60 focus:outline-none focus:ring-2 focus:ring-logs/40 focus:border-logs-strong transition"
            />
          </div>

          <div className="overflow-x-auto rounded-2xl border border-edge bg-surface shadow-sm">
            <table className="w-full text-ink">
              <thead className="bg-surface-2">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-ink-dim">
                  <th className="px-6 py-3.5">Fecha</th>
                  <th className="px-6 py-3.5">Código</th>
                  <th className="px-6 py-3.5">Origen</th>
                  <th className="px-6 py-3.5">Mensaje</th>
                </tr>
              </thead>
              <tbody>
                {errorLoading ? (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-ink-dim">
                      Cargando errores...
                    </td>
                  </tr>
                ) : errorLogs.length > 0 ? (
                  errorLogs.map((log) => (
                    <tr key={log.id} className="border-t border-edge transition hover:bg-surface-2/60">
                      <td className="px-6 py-3.5 font-data text-sm text-ink-dim whitespace-nowrap">
                        {formatDate(log.created_at)}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="font-data rounded-full bg-danger-soft px-2.5 py-1 text-xs font-medium text-danger">
                          {log.status_code ?? "—"}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 font-data text-xs text-ink-dim">
                        {log.source || "—"}
                      </td>
                      <td className="px-6 py-3.5 text-ink max-w-[420px] truncate">
                        {log.message}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-ink-dim">
                      Sin errores registrados. 🎉
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <Pager page={errorPage} pageSize={PAGE_SIZE} totalCount={errorTotalCount} onPageChange={setErrorPage} />
          </div>
        </>
      )}
    </div>
  );
}
