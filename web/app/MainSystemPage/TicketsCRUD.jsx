"use client";

import { useEffect, useState } from "react";
import { Eye, Pencil, Ban, RotateCcw, ImageOff, FileSpreadsheet, FileDown } from "lucide-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { getTicketsPaged, reactivateTicket, markTicketAsInvoiced } from "../../services/TicketsService";
import { showError, showSuccess, showConfirm } from "../../utils/alerts";
import ModalTicket from "../../Components/ModalTicket";
import ModalVoidTicket from "../../Components/ModalVoidTicket";
import Pager from "../../Components/Pager";
import ExportColumnPicker from "../../Components/ExportColumnPicker";
import { useRealtimeRefresh } from "../../hooks/useRealtimeRefresh";
import { formatDateOnly } from "../../utils/dateOnly";

const PAGE_SIZE = 25;
// pageSize grande para traer todo lo que cumple los filtros actuales al
// exportar, sin tener que armar un endpoint aparte solo para eso
const EXPORT_PAGE_SIZE = 10000;

// ticket_date es una fecha-sin-hora: se formatea sin pasar por conversion
// de zona horaria (ver utils/dateOnly), si no en Costa Rica se puede ver
// un dia antes del que en realidad es
const formatDate = formatDateOnly;

// Texto plano con todos los materiales de un acta, para Excel/PDF donde
// no cabe una fila por material como en el formulario
function itemsSummary(items) {
  if (!items || items.length === 0) return "";
  return items
    .map((i) => `${i.material_description}: ${i.quantity_kg} kg${i.physical_state ? ` (${i.physical_state})` : ""}`)
    .join("; ");
}

// Columnas disponibles al exportar, en el orden en que se muestran. Cada
// una sabe sacar su propio valor de un acta, asi exportExcel/exportPDF
// solo arman la tabla con las que el usuario haya marcado
const EXPORT_COLUMNS = [
  { key: "ticket_number", label: "No. Acta", value: (t) => t.ticket_number },
  { key: "company_name", label: "Empresa", value: (t) => t.company_name },
  { key: "ticket_date", label: "Fecha", value: (t) => formatDate(t.ticket_date) },
  { key: "client_responsible_name", label: "Responsable Cliente", value: (t) => t.client_responsible_name || "" },
  { key: "client_responsible_id", label: "Cédula Cliente", value: (t) => t.client_responsible_id || "" },
  { key: "ecoway_responsible_name", label: "Responsable EcoWay", value: (t) => t.ecoway_responsible_name || "" },
  { key: "ecoway_responsible_id", label: "Cédula EcoWay", value: (t) => t.ecoway_responsible_id || "" },
  { key: "materials", label: "Materiales", value: (t) => itemsSummary(t.items) },
  { key: "total_kg", label: "Total (kg)", value: (t) => t.total_kg },
  { key: "image", label: "Foto", value: (t) => (t.image_path ? "Sí" : "No") },
  { key: "status", label: "Estado", value: (t) => (t.status === "Active" ? "Activa" : "Anulada") },
  { key: "invoiced", label: "Facturada", value: (t) => (t.invoiced ? "Sí" : "No") },
  {
    key: "void_reason",
    label: "Motivo de anulación",
    value: (t) => (t.status === "Voided" ? t.void_reason || "" : ""),
  },
];

export default function TicketsCRUD() {
  const [tickets, setTickets] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState(null); // "excel" | "pdf" | null

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [invoicedFilter, setInvoicedFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [showTicketModal, setShowTicketModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [readOnly, setReadOnly] = useState(false);
  const [voidTarget, setVoidTarget] = useState(null);

  // el texto se manda al servidor con un pequeño retraso, para no pedir
  // una pagina nueva en cada tecla que se escribe
  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  // cualquier cambio de filtro vuelve a la primera pagina
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, invoicedFilter, dateFrom, dateTo]);

  // el select maneja texto ("" / "true" / "false"), el servicio espera un
  // boolean o undefined (sin filtrar)
  const invoicedParam = invoicedFilter === "" ? undefined : invoicedFilter === "true";

  const loadTickets = async () => {
    setLoading(true);
    try {
      const data = await getTicketsPaged({
        search,
        status: statusFilter,
        invoiced: invoicedParam,
        dateFrom,
        dateTo,
        page,
        pageSize: PAGE_SIZE,
      });
      setTickets(data.items);
      setTotalCount(data.totalCount);
    } catch {
      showError("No fue posible cargar las actas de entrada.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter, invoicedFilter, dateFrom, dateTo, page]);

  useRealtimeRefresh("tickets", loadTickets);

  const openCreate = () => {
    setSelectedTicket(null);
    setReadOnly(false);
    setShowTicketModal(true);
  };

  const openView = (ticket) => {
    setSelectedTicket(ticket);
    setReadOnly(true);
    setShowTicketModal(true);
  };

  const openEdit = (ticket) => {
    setSelectedTicket(ticket);
    setReadOnly(false);
    setShowTicketModal(true);
  };

  const handleReactivate = async (ticket) => {
    const result = await showConfirm(
      "¿Reactivar acta?",
      `El acta ${ticket.ticket_number} va a volver a quedar activa.`
    );
    if (!result.isConfirmed) return;

    try {
      await reactivateTicket(ticket.id);
      showSuccess("El acta fue reactivada correctamente.");
      loadTickets();
    } catch (error) {
      let message = "No fue posible reactivar el acta.";
      try {
        message = JSON.parse(error.message).message;
      } catch {
        message = error.message || message;
      }
      showError(message);
    }
  };

  const handleMarkAsInvoiced = async (ticket) => {
    const result = await showConfirm(
      "¿Marcar como facturada?",
      `El acta ${ticket.ticket_number} va a quedar marcada como facturada. Esta acción no se puede deshacer.`
    );
    if (!result.isConfirmed) return;

    try {
      await markTicketAsInvoiced(ticket.id);
      showSuccess("El acta fue marcada como facturada.");
      loadTickets();
    } catch (error) {
      let message = "No fue posible marcar el acta como facturada.";
      try {
        message = JSON.parse(error.message).message;
      } catch {
        message = error.message || message;
      }
      showError(message);
    }
  };

  // Los exports llevan todo lo que cumple los filtros actuales, no solo
  // la pagina que se esta viendo en pantalla
  const fetchAllFiltered = async () => {
    const data = await getTicketsPaged({
      search,
      status: statusFilter,
      invoiced: invoicedParam,
      dateFrom,
      dateTo,
      page: 1,
      pageSize: EXPORT_PAGE_SIZE,
    });
    return data.items;
  };

  const exportExcel = async (selectedKeys) => {
    setExporting(true);
    try {
      const rows = await fetchAllFiltered();
      const cols = EXPORT_COLUMNS.filter((c) => selectedKeys.includes(c.key));

      const data = rows.map((t) => {
        const row = {};
        cols.forEach((c) => {
          row[c.label] = c.value(t);
        });
        return row;
      });

      const worksheet = XLSX.utils.json_to_sheet(data);
      worksheet["!cols"] = cols.map((c) => ({ wch: Math.max(10, c.label.length + 4) }));

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "ActasEntrada");

      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });

      const file = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      saveAs(file, "ActasDeEntrada.xlsx");
    } catch {
      showError("No fue posible generar el Excel.");
    } finally {
      setExporting(false);
    }
  };

  const exportPDF = async (selectedKeys) => {
    setExporting(true);
    try {
      const rows = await fetchAllFiltered();
      const cols = EXPORT_COLUMNS.filter((c) => selectedKeys.includes(c.key));

      // Apaisado, hay bastantes columnas con toda la informacion del acta
      const doc = new jsPDF({ orientation: "landscape" });

      doc.setFontSize(18);
      doc.text("Listado de Actas de Entrada", 14, 20);

      // Las columnas de texto largo (materiales, motivo) necesitan mas
      // espacio, se ubican por su indice dentro de las columnas elegidas
      const wideColumns = ["materials", "void_reason"];
      const columnStyles = {};
      cols.forEach((c, i) => {
        if (wideColumns.includes(c.key)) columnStyles[i] = { cellWidth: 60 };
      });

      autoTable(doc, {
        startY: 28,
        styles: { fontSize: 8, cellPadding: 2.5 },
        headStyles: { fontSize: 8 },
        columnStyles,
        head: [cols.map((c) => c.label)],
        body: rows.map((t) => cols.map((c) => c.value(t))),
      });

      doc.save("ActasDeEntrada.pdf");
    } catch {
      showError("No fue posible generar el PDF.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="w-full">
      {/* ACCIONES */}
      <div className="flex flex-wrap items-center justify-end gap-3 mb-6">
        <button
          onClick={() => setExportFormat("excel")}
          disabled={exporting}
          className="flex items-center gap-2 rounded-xl border border-success/30 bg-success-soft px-4 py-2.5 text-sm font-semibold text-success transition hover:bg-success/15 disabled:opacity-60"
        >
          <FileSpreadsheet size={16} />
          Excel
        </button>

        <button
          onClick={() => setExportFormat("pdf")}
          disabled={exporting}
          className="flex items-center gap-2 rounded-xl border border-danger/30 bg-danger-soft px-4 py-2.5 text-sm font-semibold text-danger transition hover:bg-danger/15 disabled:opacity-60"
        >
          <FileDown size={16} />
          PDF
        </button>

        <button
          onClick={openCreate}
          className="rounded-xl bg-entrada px-4 py-2.5 text-sm font-medium text-white transition hover:bg-entrada-strong"
        >
          + Nueva acta de entrada
        </button>
      </div>

      {/* FILTROS */}
      <div className="mb-5 flex flex-wrap gap-3 rounded-2xl border border-edge bg-surface p-3">
        <input
          type="text"
          placeholder="Buscar por número o empresa..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="flex-1 min-w-[220px] rounded-xl border border-edge bg-surface-2 px-4 py-2 text-ink placeholder-ink-dim/60 focus:outline-none focus:ring-2 focus:ring-entrada/40 focus:border-entrada-strong transition"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-edge bg-surface-2 px-4 py-2 text-ink focus:outline-none focus:ring-2 focus:ring-entrada/40 transition"
        >
          <option value="">Todas</option>
          <option value="Active">Activas</option>
          <option value="Voided">Anuladas</option>
        </select>

        <select
          value={invoicedFilter}
          onChange={(e) => setInvoicedFilter(e.target.value)}
          className="rounded-xl border border-edge bg-surface-2 px-4 py-2 text-ink focus:outline-none focus:ring-2 focus:ring-entrada/40 transition"
        >
          <option value="">Facturada: todas</option>
          <option value="true">Facturadas</option>
          <option value="false">No facturadas</option>
        </select>

        <div className="flex items-center gap-2">
          <label htmlFor="ticket-date-from" className="text-sm text-ink-dim whitespace-nowrap">
            Desde
          </label>
          <input
            id="ticket-date-from"
            type="date"
            value={dateFrom}
            max={dateTo || undefined}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-xl border border-edge bg-surface-2 px-3 py-2 text-ink focus:outline-none focus:ring-2 focus:ring-entrada/40 transition"
          />
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="ticket-date-to" className="text-sm text-ink-dim whitespace-nowrap">
            Hasta
          </label>
          <input
            id="ticket-date-to"
            type="date"
            value={dateTo}
            min={dateFrom || undefined}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-xl border border-edge bg-surface-2 px-3 py-2 text-ink focus:outline-none focus:ring-2 focus:ring-entrada/40 transition"
          />
        </div>

        {(dateFrom || dateTo) && (
          <button
            onClick={() => {
              setDateFrom("");
              setDateTo("");
            }}
            className="rounded-xl border border-edge bg-surface px-3 py-2 text-sm font-medium text-ink-dim transition hover:bg-surface-2"
          >
            Limpiar fechas
          </button>
        )}
      </div>

      {/* TABLA */}
      <div className="overflow-x-auto rounded-2xl border border-edge bg-surface shadow-sm">
        <table className="w-full text-ink">
          <thead className="bg-entrada-soft">
            <tr className="text-left text-xs font-semibold uppercase tracking-wide text-entrada-strong">
              <th className="px-6 py-3.5 font-data font-semibold">No. Acta</th>
              <th className="px-6 py-3.5">Empresa</th>
              <th className="px-6 py-3.5">Fecha</th>
              <th className="px-6 py-3.5">Total (kg)</th>
              <th className="px-6 py-3.5">Estado</th>
              <th className="px-6 py-3.5">Facturada</th>
              <th className="px-6 py-3.5">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-ink-dim">
                  Cargando actas de entrada...
                </td>
              </tr>
            ) : tickets.length > 0 ? (
              tickets.map((t) => (
                <tr key={t.id} className="border-t border-edge transition hover:bg-surface-2/60">
                  <td className="px-6 py-4 font-data font-medium">
                    <div className="flex items-center gap-2">
                      {!t.image_path && (
                        <ImageOff size={14} className="text-ink-dim/50" aria-label="Sin foto del acta" />
                      )}
                      {t.ticket_number}
                    </div>
                  </td>
                  <td className="px-6 py-4">{t.company_name}</td>
                  <td className="px-6 py-4 font-data text-ink-dim">{formatDate(t.ticket_date)}</td>
                  <td className="px-6 py-4 font-data">{t.total_kg.toLocaleString("es-CR")}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${
                        t.status === "Active"
                          ? "bg-entrada-soft text-entrada-strong"
                          : "bg-danger-soft text-danger"
                      }`}
                      title={t.status === "Voided" ? t.void_reason ?? "" : ""}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${t.status === "Active" ? "bg-entrada-strong" : "bg-danger"}`} />
                      {t.status === "Active" ? "Activa" : "Anulada"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={t.invoiced}
                      disabled={t.invoiced || t.status !== "Active"}
                      onChange={() => handleMarkAsInvoiced(t)}
                      aria-label={`Marcar acta de entrada ${t.ticket_number} como facturada`}
                      title={`Marcar acta de entrada ${t.ticket_number} como facturada`}
                      className="h-4 w-4 cursor-pointer accent-entrada disabled:cursor-not-allowed"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openView(t)}
                        aria-label={`Ver acta de entrada ${t.ticket_number}`}
                        title={`Ver acta de entrada ${t.ticket_number}`}
                        className="rounded-lg border border-edge p-2 text-ink-dim transition hover:bg-surface-2 hover:text-ink"
                      >
                        <Eye size={16} />
                      </button>

                      {t.status === "Active" && (
                        <>
                          <button
                            onClick={() => openEdit(t)}
                            aria-label={`Editar acta de entrada ${t.ticket_number}`}
                            title={`Editar acta de entrada ${t.ticket_number}`}
                            className="rounded-lg border border-edge p-2 text-ink-dim transition hover:bg-surface-2 hover:text-ink"
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            onClick={() => setVoidTarget(t)}
                            aria-label={`Anular acta de entrada ${t.ticket_number}`}
                            title={`Anular acta de entrada ${t.ticket_number}`}
                            className="rounded-lg border border-danger/20 bg-danger-soft p-2 text-danger transition hover:brightness-95"
                          >
                            <Ban size={16} />
                          </button>
                        </>
                      )}

                      {t.status === "Voided" && (
                        <button
                          onClick={() => handleReactivate(t)}
                          aria-label={`Reactivar acta de entrada ${t.ticket_number}`}
                          title={`Reactivar acta de entrada ${t.ticket_number}`}
                          className="rounded-lg border border-entrada/20 bg-entrada-soft p-2 text-entrada-strong transition hover:brightness-95"
                        >
                          <RotateCcw size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="py-10 text-center text-ink-dim">
                  No hay actas de entrada registradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <Pager page={page} pageSize={PAGE_SIZE} totalCount={totalCount} onPageChange={setPage} />
      </div>

      {showTicketModal && (
        <ModalTicket
          ticket={selectedTicket}
          readOnly={readOnly}
          onClose={() => setShowTicketModal(false)}
          onSaved={() => {
            setShowTicketModal(false);
            loadTickets();
          }}
        />
      )}

      {voidTarget && (
        <ModalVoidTicket
          ticket={voidTarget}
          onClose={() => setVoidTarget(null)}
          onVoided={() => {
            setVoidTarget(null);
            loadTickets();
          }}
        />
      )}

      <ExportColumnPicker
        open={!!exportFormat}
        format={exportFormat}
        columns={EXPORT_COLUMNS}
        onCancel={() => setExportFormat(null)}
        onConfirm={(selectedKeys) => {
          const format = exportFormat;
          setExportFormat(null);
          if (format === "excel") exportExcel(selectedKeys);
          else exportPDF(selectedKeys);
        }}
      />
    </div>
  );
}
