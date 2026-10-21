"use client";

import { useEffect, useState } from "react";
import { Eye, FileSpreadsheet, FileDown } from "lucide-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  getExitTicketItemsManagement,
  markExitTicketItemAsManaged,
  getExitTicket,
} from "../../services/ExitTicketsService";
import { showError, showSuccess, showConfirm } from "../../utils/alerts";
import ModalExitTicket from "../../Components/ModalExitTicket";
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

// Para management_date, que si es un instante real (se marca a mano, con
// hora incluida) — a diferencia de exit_date (fecha-sin-hora), acá la
// conversion de zona horaria es correcta
function formatDate(value) {
  return new Date(value).toLocaleDateString("es-CR");
}

// dias entre dos fechas, hasta hoy si no se pasa la segunda, nunca negativo
function daysBetween(from, to) {
  const d1 = new Date(`${String(from).slice(0, 10)}T00:00:00`);
  const d2 = to ? new Date(`${String(to).slice(0, 10)}T00:00:00`) : new Date();
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return 0;
  return Math.max(0, Math.floor((d2.getTime() - d1.getTime()) / 86400000));
}

// si el material ya se gestiono, los dias se congelan en lo que tardo;
// si no, siguen contando hasta hoy
function managementDays(item) {
  return item.management_date
    ? daysBetween(item.exit_date, item.management_date)
    : daysBetween(item.exit_date);
}

// Columnas disponibles al exportar, en el orden en que se muestran
const EXPORT_COLUMNS = [
  { key: "exit_ticket_number", label: "No. Acta", value: (i) => i.exit_ticket_number },
  { key: "destination_company_name", label: "Empresa de destino", value: (i) => i.destination_company_name },
  { key: "exit_date", label: "Fecha de recolección", value: (i) => formatDateOnly(i.exit_date) },
  { key: "receiver_responsible_name", label: "Responsable Receptor", value: (i) => i.receiver_responsible_name || "" },
  { key: "receiver_responsible_id", label: "Cédula Receptor", value: (i) => i.receiver_responsible_id || "" },
  { key: "ecoway_responsible_name", label: "Responsable EcoWay", value: (i) => i.ecoway_responsible_name || "" },
  { key: "ecoway_responsible_id", label: "Cédula EcoWay", value: (i) => i.ecoway_responsible_id || "" },
  { key: "material_description", label: "Material", value: (i) => i.material_description },
  { key: "physical_state", label: "Estado físico", value: (i) => i.physical_state || "" },
  { key: "quantity_kg", label: "Cantidad (kg)", value: (i) => i.quantity_kg },
  { key: "image", label: "Foto", value: (i) => (i.image_path ? "Sí" : "No") },
  { key: "management_date", label: "Fecha de gestión", value: (i) => (i.management_date ? formatDate(i.management_date) : "") },
  { key: "management_days", label: "Días de gestión", value: (i) => managementDays(i) },
  { key: "management_status", label: "Estado gestión", value: (i) => (i.management_date ? "Completado" : "Pendiente") },
];

export default function ExitTicketsManagementView() {
  const [items, setItems] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState(null); // "excel" | "pdf" | null

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  // Gestion: si ya se proceso o no, maximo de dias transcurridos, y si se
  // quiere ver solo lo que ya paso su plazo del catalogo
  const [managementFilter, setManagementFilter] = useState("");
  const [minDays, setMinDays] = useState("");
  const [onlyOverdue, setOnlyOverdue] = useState(false);

  const [showExitTicketModal, setShowExitTicketModal] = useState(false);
  const [selectedExitTicket, setSelectedExitTicket] = useState(null);
  const [viewLoadingId, setViewLoadingId] = useState(null);

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
      const data = await getExitTicketItemsManagement({
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
      showError("No fue posible cargar el estado de las actas de salida.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, managementFilter, minDays, onlyOverdue, page]);

  useRealtimeRefresh("exitTickets", loadItems);

  const fetchAllFiltered = async () => {
    const data = await getExitTicketItemsManagement({
      search,
      management: managementFilter,
      minDays: parsedMinDays(minDays),
      onlyOverdue,
      page: 1,
      pageSize: EXPORT_PAGE_SIZE,
    });
    return data.items;
  };

  // Una vez marcado, no se puede volver a tocar
  const handleMarkAsManaged = async (item) => {
    const result = await showConfirm(
      "¿Marcar como gestionado?",
      `El material "${item.material_description}" del acta ${item.exit_ticket_number} va a quedar marcado como gestionado con la fecha de hoy. Esta acción no se puede deshacer.`
    );
    if (!result.isConfirmed) return;

    try {
      await markExitTicketItemAsManaged(item.id);
      showSuccess("El material fue marcado como gestionado.");
      loadItems();
    } catch (error) {
      let message = "No fue posible marcar el material como gestionado.";
      try {
        message = JSON.parse(error.message).message;
      } catch {
        message = error.message || message;
      }
      showError(message);
    }
  };

  const handleView = async (item) => {
    setViewLoadingId(item.id);
    try {
      const exitTicket = await getExitTicket(item.exit_ticket_id);
      setSelectedExitTicket(exitTicket);
      setShowExitTicketModal(true);
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
      XLSX.utils.book_append_sheet(workbook, worksheet, "EstadoActasSalida");

      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });

      const file = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      saveAs(file, "EstadoDeActasDeSalida.xlsx");
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
      doc.text("Inventario de Actas de Salida", 14, 20);

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

      doc.save("EstadoDeActasDeSalida.pdf");
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
          className="flex-1 min-w-[220px] rounded-xl border border-edge bg-surface-2 px-4 py-2 text-ink placeholder-ink-dim/60 focus:outline-none focus:ring-2 focus:ring-salida/40 focus:border-salida-strong transition"
        />

        <select
          value={managementFilter}
          onChange={(e) => setManagementFilter(e.target.value)}
          className="rounded-xl border border-edge bg-surface-2 px-4 py-2 text-ink focus:outline-none focus:ring-2 focus:ring-salida/40 transition"
        >
          <option value="">Gestión: todas</option>
          <option value="pending">Pendientes</option>
          <option value="done">Completadas</option>
        </select>

        <div className="flex items-center gap-2">
          <label htmlFor="exit-mgmt-min-days" className="text-sm text-ink-dim whitespace-nowrap">
            Días restantes ≤
          </label>
          <input
            id="exit-mgmt-min-days"
            type="text"
            inputMode="numeric"
            value={minDays}
            onChange={(e) => setMinDays(e.target.value.replace(/[^0-9-]/g, ""))}
            placeholder="Todos"
            title="Días que faltan para el plazo del material en el catálogo, contado desde la fecha de salida (puede ser negativo, para ver qué tan vencido está). Los materiales sin plazo definido no entran acá"
            className="w-20 rounded-xl border border-edge bg-surface-2 px-3 py-2 text-ink focus:outline-none focus:ring-2 focus:ring-salida/40 transition"
          />
        </div>

        <label
          htmlFor="exit-mgmt-only-overdue"
          className="flex items-center gap-2 rounded-xl border border-edge bg-surface-2 px-3 py-2 text-sm text-ink-dim cursor-pointer"
          title="Materiales que ya pasaron el plazo del catálogo (Materiales → días de gestión), contado desde la fecha de salida"
        >
          <input
            id="exit-mgmt-only-overdue"
            type="checkbox"
            checked={onlyOverdue}
            onChange={(e) => setOnlyOverdue(e.target.checked)}
            className="h-4 w-4 cursor-pointer accent-salida"
          />
          Solo vencidos
        </label>
      </div>

      {/* TABLA */}
      <div className="overflow-x-auto rounded-2xl border border-edge bg-surface shadow-sm">
        <table className="w-full text-ink">
          <thead className="bg-salida-soft">
            <tr className="text-left text-xs font-semibold uppercase tracking-wide text-salida-strong">
              <th className="px-6 py-3.5 font-data font-semibold">No. Acta</th>
              <th className="px-6 py-3.5">Empresa de destino</th>
              <th className="px-6 py-3.5">Fecha de recolección</th>
              <th className="px-6 py-3.5">Material</th>
              <th className="px-6 py-3.5">Cantidad (kg)</th>
              <th className="px-6 py-3.5">Fecha de gestión</th>
              <th className="px-6 py-3.5">Días de gestión</th>
              <th className="px-6 py-3.5">Estado gestión</th>
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
              items.map((i) => (
                <tr key={i.id} className="border-t border-edge transition hover:bg-surface-2/60">
                  <td className="px-6 py-4 font-data font-medium">{i.exit_ticket_number}</td>
                  <td className="px-6 py-4">{i.destination_company_name}</td>
                  <td className="px-6 py-4 font-data text-ink-dim">{formatDateOnly(i.exit_date)}</td>
                  <td className="px-6 py-4">
                    {i.material_description}
                    {i.physical_state && (
                      <span className="ml-1.5 text-xs text-ink-dim">({i.physical_state})</span>
                    )}
                  </td>
                  <td className="px-6 py-4 font-data">{i.quantity_kg.toLocaleString("es-CR")}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col items-start gap-0.5">
                      <input
                        type="checkbox"
                        checked={!!i.management_date}
                        disabled={!!i.management_date}
                        onChange={() => handleMarkAsManaged(i)}
                        aria-label={`Marcar material ${i.material_description} del acta ${i.exit_ticket_number} como gestionado`}
                        title={`Marcar material ${i.material_description} del acta ${i.exit_ticket_number} como gestionado`}
                        className="h-4 w-4 cursor-pointer accent-salida disabled:cursor-not-allowed"
                      />
                      {i.management_date && (
                        <span className="font-data text-xs text-ink-dim">{formatDate(i.management_date)}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-data text-ink-dim">{managementDays(i)}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${
                        i.management_date
                          ? "bg-salida-soft text-salida-strong"
                          : "bg-surface-2 text-ink-dim"
                      }`}
                    >
                      {i.management_date ? "Completado" : "Pendiente"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleView(i)}
                      disabled={viewLoadingId === i.id}
                      aria-label={`Ver acta de salida ${i.exit_ticket_number}`}
                      title={`Ver acta de salida ${i.exit_ticket_number}`}
                      className="rounded-lg border border-edge p-2 text-ink-dim transition hover:bg-surface-2 hover:text-ink disabled:opacity-60"
                    >
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))
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

      {showExitTicketModal && (
        <ModalExitTicket
          exitTicket={selectedExitTicket}
          readOnly
          onClose={() => setShowExitTicketModal(false)}
          onSaved={() => setShowExitTicketModal(false)}
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
