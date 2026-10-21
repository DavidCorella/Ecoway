"use client";

import { useEffect, useState } from "react";
import { Eye, FileSpreadsheet, FileDown, History } from "lucide-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  getTicketItemsManagement,
  processTicketItemQuantity,
  getTicket,
} from "../../services/TicketsService";
import { showError, showSuccess, showConfirm } from "../../utils/alerts";
import ModalTicket from "../../Components/ModalTicket";
import ModalProcessingHistory from "../../Components/ModalProcessingHistory";
import Pager from "../../Components/Pager";
import ExportColumnPicker from "../../Components/ExportColumnPicker";
import { useRealtimeRefresh } from "../../hooks/useRealtimeRefresh";
import { formatDateOnly } from "../../utils/dateOnly";

// El campo de dias restantes admite un "-" inicial (para filtrar por
// negativos, ej. "-30" = vencido hace mas de 30 dias), pero mientras se
// esta escribiendo puede quedar solo en "-" o vacio — en esos casos no se
// manda nada, para no pedirle al backend un numero invalido
const parsedMinDays = (value) => {
  const n = Number(value);
  return value !== "" && value !== "-" && Number.isFinite(n) ? n : undefined;
};

const PAGE_SIZE = 25;
const EXPORT_PAGE_SIZE = 10000;

// Para processed_at, que si es un instante real (se marca a mano, con
// hora incluida) — a diferencia de ticket_date (fecha-sin-hora), acá la
// conversion de zona horaria es correcta
function formatDate(value) {
  return new Date(value).toLocaleDateString("es-CR");
}

function addDays(dateStr, days) {
  const d = new Date(`${String(dateStr).slice(0, 10)}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d;
}

function toDateOnly(dateStr) {
  return new Date(`${String(dateStr).slice(0, 10)}T00:00:00`);
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

// Cuenta regresiva hasta el limite del material (fecha del acta + plazo
// del material en el catalogo). Una vez marcado como procesado se
// congela en lo que faltaba ese dia; mientras siga pendiente, sigue
// bajando cada dia y puede quedar en negativo si ya se paso el plazo.
// Null si el material no tiene un plazo definido en el catalogo (no esta
// en el catalogo, o el catalogo no le tiene plazo)
function daysRemaining(item) {
  if (item.max_management_days == null) return null;

  const deadline = addDays(item.ticket_date, item.max_management_days);
  const reference = item.processed_at ? toDateOnly(item.processed_at) : startOfToday();

  return Math.round((deadline.getTime() - reference.getTime()) / 86400000);
}

// Kilos disponibles de esta linea puntual: lo que no se saco todavia en
// actas de salida ni se proceso a mano (puede ser un procesado parcial).
function availableKg(item) {
  return Math.max(0, item.quantity_kg - item.consumed_kg - item.processed_kg);
}

// Cuanto se le puede procesar todavia: el mismo disponible de arriba, es
// el tope del input de "procesar cantidad"
function remainingToProcess(item) {
  return availableKg(item);
}

// Columnas disponibles al exportar, en el orden en que se muestran
const EXPORT_COLUMNS = [
  { key: "ticket_number", label: "No. Acta", value: (i) => i.ticket_number },
  { key: "company_name", label: "Empresa", value: (i) => i.company_name },
  { key: "ticket_date", label: "Fecha de recolección", value: (i) => formatDateOnly(i.ticket_date) },
  { key: "client_responsible_name", label: "Responsable Cliente", value: (i) => i.client_responsible_name || "" },
  { key: "client_responsible_id", label: "Cédula Cliente", value: (i) => i.client_responsible_id || "" },
  { key: "ecoway_responsible_name", label: "Responsable EcoWay", value: (i) => i.ecoway_responsible_name || "" },
  { key: "ecoway_responsible_id", label: "Cédula EcoWay", value: (i) => i.ecoway_responsible_id || "" },
  { key: "material_description", label: "Material", value: (i) => i.material_description },
  { key: "physical_state", label: "Estado físico", value: (i) => i.physical_state || "" },
  { key: "quantity_kg", label: "Cantidad (kg)", value: (i) => i.quantity_kg },
  { key: "processed_kg", label: "Procesado (kg)", value: (i) => i.processed_kg },
  { key: "available_kg", label: "Material disponible (kg)", value: (i) => availableKg(i) },
  { key: "image", label: "Foto", value: (i) => (i.image_path ? "Sí" : "No") },
  { key: "processed_at", label: "Fecha de procesado completo", value: (i) => (i.processed_at ? formatDate(i.processed_at) : "") },
  { key: "days_remaining", label: "Días de gestión", value: (i) => daysRemaining(i) ?? "Sin plazo" },
  { key: "management_status", label: "Estado gestión", value: (i) => i.status },
];

export default function TicketsManagementView() {
  const [items, setItems] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState(null); // "excel" | "pdf" | null

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  // Gestion: si ya se proceso o no (a mano), maximo de dias transcurridos,
  // y si se quiere ver solo lo que ya paso su plazo del catalogo
  const [managementFilter, setManagementFilter] = useState("");
  const [minDays, setMinDays] = useState("");
  const [onlyOverdue, setOnlyOverdue] = useState(false);

  const [showTicketModal, setShowTicketModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [viewLoadingId, setViewLoadingId] = useState(null);
  // Solo el id: asi si la lista se refresca (realtime, o al procesar mas
  // cantidad) mientras el modal esta abierto, muestra el dato mas nuevo
  // en vez de quedarse con la foto del momento en que se abrio
  const [historyItemId, setHistoryItemId] = useState(null);
  const historyItem = items.find((i) => i.id === historyItemId) ?? null;

  // Cuanto escribio el usuario en el input de "procesar cantidad" de cada
  // fila, por id de linea. Se limpia solo cuando esa linea recarga
  const [processInputs, setProcessInputs] = useState({});
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [search, managementFilter, minDays, onlyOverdue]);

  // Este endpoint ya solo devuelve materiales de actas activas
  const loadItems = async () => {
    setLoading(true);
    try {
      const data = await getTicketItemsManagement({
        search,
        management: managementFilter,
        minDays: parsedMinDays(minDays),
        onlyOverdue,
        page,
        pageSize: PAGE_SIZE,
      });
      setItems(data.items);
      setTotalCount(data.totalCount);
    } catch {
      showError("No fue posible cargar el estado de las actas de entrada.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, managementFilter, minDays, onlyOverdue, page]);

  // Esta pantalla depende tanto de las actas de entrada como de lo que se
  // haya reservado en actas de salida (consumed_kg / disponible)
  useRealtimeRefresh("tickets", loadItems);
  useRealtimeRefresh("exitTickets", loadItems);

  const fetchAllFiltered = async () => {
    const data = await getTicketItemsManagement({
      search,
      management: managementFilter,
      minDays: parsedMinDays(minDays),
      onlyOverdue,
      page: 1,
      pageSize: EXPORT_PAGE_SIZE,
    });
    return data.items;
  };

  const handleProcessInputChange = (itemId, value) => {
    // Solo digitos y un punto decimal, igual que otros campos de kilos
    const cleaned = value.replace(/[^0-9.]/g, "");
    const firstDot = cleaned.indexOf(".");
    const sanitized =
      firstDot === -1 ? cleaned : cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, "");
    setProcessInputs((prev) => ({ ...prev, [itemId]: sanitized }));
  };

  // Procesa la cantidad que se haya escrito para esa linea. Se puede
  // repetir varias veces hasta completar el total — cada corte queda en
  // el historial. Una vez que se completa el total, la linea pasa a
  // "Procesada" sola y no se puede volver a tocar
  const handleProcessQuantity = async (item) => {
    const raw = processInputs[item.id];
    const quantity = Number(raw);
    const remaining = remainingToProcess(item);

    if (!raw || !(quantity > 0)) {
      showError("Ingresá una cantidad válida en kilos.");
      return;
    }

    if (quantity > remaining) {
      showError(`Solo quedan ${remaining.toLocaleString("es-CR")} kg disponibles para procesar de este material.`);
      return;
    }

    const completesAll = quantity >= remaining;
    const result = await showConfirm(
      completesAll ? "¿Procesar el resto del material?" : "¿Procesar esta cantidad?",
      completesAll
        ? `Se van a procesar ${quantity.toLocaleString("es-CR")} kg de "${item.material_description}" del acta ${item.ticket_number} — con esto queda completamente procesado. Esta acción no se puede deshacer.`
        : `Se van a procesar ${quantity.toLocaleString("es-CR")} kg de "${item.material_description}" del acta ${item.ticket_number} (de ${remaining.toLocaleString("es-CR")} kg disponibles). Esta acción no se puede deshacer.`
    );
    if (!result.isConfirmed) return;

    setProcessingId(item.id);
    try {
      await processTicketItemQuantity(item.id, quantity);
      showSuccess("La cantidad fue procesada correctamente.");
      setProcessInputs((prev) => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });
      loadItems();
    } catch (error) {
      let message = "No fue posible procesar el material.";
      try {
        message = JSON.parse(error.message).message;
      } catch {
        message = error.message || message;
      }
      showError(message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleView = async (item) => {
    setViewLoadingId(item.id);
    try {
      const ticket = await getTicket(item.ticket_id);
      setSelectedTicket(ticket);
      setShowTicketModal(true);
    } catch {
      showError("No fue posible cargar el acta.");
    } finally {
      setViewLoadingId(null);
    }
  };

  const exportExcel = async (selectedKeys) => {
    setExporting(true);
    try {
      const rows = await fetchAllFiltered();
      const cols = EXPORT_COLUMNS.filter((c) => selectedKeys.includes(c.key));

      const data = rows.map((i) => {
        const row = {};
        cols.forEach((c) => {
          row[c.label] = c.value(i);
        });
        return row;
      });

      const worksheet = XLSX.utils.json_to_sheet(data);
      worksheet["!cols"] = cols.map((c) => ({ wch: Math.max(10, c.label.length + 4) }));

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "EstadoActas");

      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });

      const file = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      saveAs(file, "EstadoDeActasDeEntrada.xlsx");
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
      doc.text("Inventario de Actas de Entrada", 14, 20);

      // El material necesita mas espacio, se ubica por su indice dentro
      // de las columnas elegidas
      const columnStyles = {};
      cols.forEach((c, i) => {
        if (c.key === "material_description") columnStyles[i] = { cellWidth: 45 };
      });

      autoTable(doc, {
        startY: 28,
        styles: { fontSize: 8, cellPadding: 2.5 },
        headStyles: { fontSize: 8 },
        columnStyles,
        head: [cols.map((c) => c.label)],
        body: rows.map((i) => cols.map((c) => c.value(i))),
      });

      doc.save("EstadoDeActasDeEntrada.pdf");
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
      </div>

      {/* FILTROS */}
      <div className="mb-5 flex flex-wrap gap-3 rounded-2xl border border-edge bg-surface p-3">
        <input
          type="text"
          placeholder="Buscar por acta, empresa o material..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="flex-1 min-w-[220px] rounded-xl border border-edge bg-surface-2 px-4 py-2 text-ink placeholder-ink-dim/60 focus:outline-none focus:ring-2 focus:ring-entrada/40 focus:border-entrada-strong transition"
        />

        <select
          value={managementFilter}
          onChange={(e) => setManagementFilter(e.target.value)}
          className="rounded-xl border border-edge bg-surface-2 px-4 py-2 text-ink focus:outline-none focus:ring-2 focus:ring-entrada/40 transition"
        >
          <option value="">Gestión: todas</option>
          <option value="pending">Pendientes</option>
          <option value="done">Procesadas</option>
        </select>

        <div className="flex items-center gap-2">
          <label htmlFor="mgmt-min-days" className="text-sm text-ink-dim whitespace-nowrap">
            Días restantes ≤
          </label>
          <input
            id="mgmt-min-days"
            type="text"
            inputMode="numeric"
            value={minDays}
            onChange={(e) => setMinDays(e.target.value.replace(/[^0-9-]/g, ""))}
            placeholder="Todos"
            title="Días que faltan para el plazo del material en el catálogo (puede ser negativo, para ver qué tan vencido está). Los materiales sin plazo definido no entran acá"
            className="w-20 rounded-xl border border-edge bg-surface-2 px-3 py-2 text-ink focus:outline-none focus:ring-2 focus:ring-entrada/40 transition"
          />
        </div>

        <label
          htmlFor="mgmt-only-overdue"
          className="flex items-center gap-2 rounded-xl border border-edge bg-surface-2 px-3 py-2 text-sm text-ink-dim cursor-pointer"
          title="Materiales que ya pasaron el plazo del catálogo (Materiales → días de gestión), sin importar el filtro de días transcurridos"
        >
          <input
            id="mgmt-only-overdue"
            type="checkbox"
            checked={onlyOverdue}
            onChange={(e) => setOnlyOverdue(e.target.checked)}
            className="h-4 w-4 cursor-pointer accent-entrada"
          />
          Solo vencidos
        </label>
      </div>

      {/* TABLA */}
      <div className="overflow-x-auto rounded-2xl border border-edge bg-surface shadow-sm">
        <table className="w-full text-ink">
          <thead className="bg-entrada-soft">
            <tr className="text-left text-xs font-semibold uppercase tracking-wide text-entrada-strong">
              <th className="px-6 py-3.5 font-data font-semibold">No. Acta</th>
              <th className="px-6 py-3.5">Empresa</th>
              <th className="px-6 py-3.5">Fecha de recolección</th>
              <th className="px-6 py-3.5">Material</th>
              <th className="px-6 py-3.5">Cantidad (kg)</th>
              <th className="px-6 py-3.5">Material disponible</th>
              <th className="px-6 py-3.5">Procesada</th>
              <th className="px-6 py-3.5">Días de gestión</th>
              <th className="px-6 py-3.5">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="py-10 text-center text-ink-dim">
                  Cargando...
                </td>
              </tr>
            ) : items.length > 0 ? (
              items.map((i) => {
                const remaining = daysRemaining(i);
                const overdue = remaining !== null && remaining <= 0;

                return (
                <tr
                  key={i.id}
                  className={`border-t border-edge transition ${
                    overdue ? "bg-danger-soft hover:bg-danger-soft/80" : "hover:bg-surface-2/60"
                  }`}
                >
                  <td className="px-6 py-4 font-data font-medium">{i.ticket_number}</td>
                  <td className="px-6 py-4">{i.company_name}</td>
                  <td className="px-6 py-4 font-data text-ink-dim">{formatDateOnly(i.ticket_date)}</td>
                  <td className="px-6 py-4">
                    {i.material_description}
                    {i.physical_state && (
                      <span className="ml-1.5 text-xs text-ink-dim">({i.physical_state})</span>
                    )}
                  </td>
                  <td className="px-6 py-4 font-data">{i.quantity_kg.toLocaleString("es-CR")}</td>
                  <td className="px-6 py-4 font-data text-ink-dim">
                    {availableKg(i).toLocaleString("es-CR")} / {i.quantity_kg.toLocaleString("es-CR")} kg
                  </td>
                  <td className="px-6 py-4">
                    {i.status === "Procesada" ? (
                      <div className="flex flex-col items-start gap-1">
                        <span className="inline-flex items-center gap-1 rounded-full bg-entrada-soft px-2.5 py-1 text-xs font-semibold text-entrada-strong">
                          Procesada
                        </span>
                        {i.processed_at && (
                          <span className="font-data text-xs text-ink-dim">{formatDate(i.processed_at)}</span>
                        )}
                        {i.processings?.length > 0 && (
                          <button
                            onClick={() => setHistoryItemId(i.id)}
                            title={`Ver historial de procesado de ${i.material_description}`}
                            className="inline-flex items-center gap-1 rounded-lg border border-edge px-2 py-1 text-xs text-ink-dim transition hover:bg-surface-2 hover:text-ink"
                          >
                            <History size={13} />
                            Ver historial
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-start gap-1 min-w-[150px]">
                        {i.processed_kg > 0 && (
                          <span className="font-data text-xs text-ink-dim">
                            {i.processed_kg.toLocaleString("es-CR")} kg procesados
                          </span>
                        )}
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            inputMode="decimal"
                            value={processInputs[i.id] ?? ""}
                            onChange={(e) => handleProcessInputChange(i.id, e.target.value)}
                            placeholder={`Máx. ${remainingToProcess(i).toLocaleString("es-CR")}`}
                            aria-label={`Cantidad a procesar de ${i.material_description} del acta ${i.ticket_number}`}
                            className="w-24 rounded-lg border border-edge bg-surface-2 px-2 py-1.5 text-sm text-ink outline-none transition focus:border-entrada-strong focus:bg-surface focus:ring-2 focus:ring-entrada/30"
                          />
                          <button
                            onClick={() => handleProcessQuantity(i)}
                            disabled={processingId === i.id}
                            title={`Procesar esta cantidad de ${i.material_description}`}
                            className="rounded-lg border border-entrada/30 bg-entrada-soft px-2.5 py-1.5 text-xs font-semibold text-entrada-strong transition hover:bg-entrada/15 disabled:opacity-60"
                          >
                            Procesar
                          </button>
                        </div>
                        {i.processings?.length > 0 && (
                          <button
                            onClick={() => setHistoryItemId(i.id)}
                            title={`Ver historial de procesado de ${i.material_description}`}
                            className="inline-flex items-center gap-1 rounded-lg border border-edge px-2 py-1 text-xs text-ink-dim transition hover:bg-surface-2 hover:text-ink"
                          >
                            <History size={13} />
                            Ver historial
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                  <td className={`px-6 py-4 font-data ${overdue ? "font-semibold text-danger" : "text-ink-dim"}`}>
                    {remaining === null ? "—" : remaining}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleView(i)}
                      disabled={viewLoadingId === i.id}
                      aria-label={`Ver acta de entrada ${i.ticket_number}`}
                      title={`Ver acta de entrada ${i.ticket_number}`}
                      className="rounded-lg border border-edge p-2 text-ink-dim transition hover:bg-surface-2 hover:text-ink disabled:opacity-60"
                    >
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={9} className="py-10 text-center text-ink-dim">
                  No hay materiales que coincidan con los filtros.
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
          readOnly
          onClose={() => setShowTicketModal(false)}
          onSaved={() => setShowTicketModal(false)}
        />
      )}

      {historyItem && (
        <ModalProcessingHistory item={historyItem} onClose={() => setHistoryItemId(null)} />
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
