"use client";

import { useEffect, useState } from "react";
import { Eye, Pencil, Ban, FileDown, FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { getSummaries } from "../../services/CollectionSummariesService";
import { showError } from "../../utils/alerts";
import ModalCollectionSummary from "../../Components/ModalCollectionSummary";
import ModalVoidCollectionSummary from "../../Components/ModalVoidCollectionSummary";
import { generateCollectionSummaryPdf } from "../../utils/collectionSummaryPdf";
import { generateCollectionSummaryExcel } from "../../utils/collectionSummaryExcel";
import Pager from "../../Components/Pager";
import ExportColumnPicker from "../../Components/ExportColumnPicker";
import { useRealtimeRefresh } from "../../hooks/useRealtimeRefresh";
import { formatDateOnly } from "../../utils/dateOnly";

const PAGE_SIZE = 25;
const EXPORT_PAGE_SIZE = 10000;

// date_from/date_to son fechas-sin-hora: se formatean sin pasar por
// conversion de zona horaria (ver utils/dateOnly), si no en Costa Rica se
// pueden ver un dia antes del que en realidad son
const formatDate = formatDateOnly;

// A, B, ..., Z, AA, AB, ... para ubicar celdas de Excel por indice de
// columna (0-based)
function excelColumnLetter(index) {
  let letter = "";
  let n = index;
  while (n >= 0) {
    letter = String.fromCharCode((n % 26) + 65) + letter;
    n = Math.floor(n / 26) - 1;
  }
  return letter;
}

// Columnas disponibles al exportar el listado, en el orden en que se
// muestran (no confundir con generateCollectionSummaryPdf/Excel, que
// generan el resumen individual de cada fila, no la tabla). Total lleva
// currency: true porque cada fila puede estar en una moneda distinta
const EXPORT_COLUMNS = [
  { key: "company_name", label: "Empresa", value: (s) => s.company_name },
  { key: "period_label", label: "Periodo", value: (s) => s.period_label },
  { key: "date_from", label: "Desde", value: (s) => formatDate(s.date_from) },
  { key: "date_to", label: "Hasta", value: (s) => formatDate(s.date_to) },
  { key: "tickets_count", label: "Actas", value: (s) => s.tickets.length },
  { key: "total_kg", label: "Total (kg)", value: (s) => s.total_kg },
  { key: "currency", label: "Moneda", value: (s) => s.currency },
  { key: "total", label: "Total", value: (s) => s.total, currency: true },
  { key: "status", label: "Estado", value: (s) => (s.status === "Active" ? "Activo" : "Anulado") },
];

// El resumen ya trae los totales calculados por el backend, aca solo se
// arma el objeto que espera el generador de PDF/Excel
function toExportData(s) {
  return {
    summary_number: s.summary_number,
    company_name: s.company_name,
    company_address: s.company_address,
    date_from: s.date_from,
    date_to: s.date_to,
    period_label: s.period_label,
    contact_name: s.contact_name,
    contact_position: s.contact_position,
    contact_phone: s.contact_phone,
    contact_cell: s.contact_cell,
    contact_email: s.contact_email,
    tickets: s.tickets,
    materials: s.materials,
    freights: s.freights,
    freight_price: s.freight_price,
    tax_rate: s.tax_rate,
    currency: s.currency,
    total_kg: s.total_kg,
    materials_total: s.materials_total,
    freight_count: s.freight_count,
    freight_total: s.freight_total,
    subtotal: s.subtotal,
    tax_amount: s.tax_amount,
    total: s.total,
  };
}

export default function CollectionSummariesCRUD() {
  const [summaries, setSummaries] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState(null); // "excel" | "pdf" | null

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [periodFrom, setPeriodFrom] = useState("");
  const [periodTo, setPeriodTo] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [selectedSummary, setSelectedSummary] = useState(null);
  const [readOnly, setReadOnly] = useState(false);
  const [voidTarget, setVoidTarget] = useState(null);

  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, periodFrom, periodTo]);

  const loadSummaries = async () => {
    setLoading(true);
    try {
      const data = await getSummaries({
        search,
        status: statusFilter,
        periodFrom,
        periodTo,
        page,
        pageSize: PAGE_SIZE,
      });
      setSummaries(data.items);
      setTotalCount(data.totalCount);
    } catch {
      showError("No fue posible cargar los resúmenes de recolección.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummaries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter, periodFrom, periodTo, page]);

  useRealtimeRefresh("collectionSummaries", loadSummaries);

  const openCreate = () => {
    setSelectedSummary(null);
    setReadOnly(false);
    setShowModal(true);
  };

  const openView = (summary) => {
    setSelectedSummary(summary);
    setReadOnly(true);
    setShowModal(true);
  };

  const openEdit = (summary) => {
    setSelectedSummary(summary);
    setReadOnly(false);
    setShowModal(true);
  };

  const fetchAllFiltered = async () => {
    const data = await getSummaries({
      search,
      status: statusFilter,
      periodFrom,
      periodTo,
      page: 1,
      pageSize: EXPORT_PAGE_SIZE,
    });
    return data.items;
  };

  const exportExcelList = async (selectedKeys) => {
    setExporting(true);
    try {
      const rows = await fetchAllFiltered();
      const cols = EXPORT_COLUMNS.filter((c) => selectedKeys.includes(c.key));

      const data = rows.map((s) => {
        const row = {};
        cols.forEach((c) => {
          row[c.label] = c.value(s);
        });
        return row;
      });

      const worksheet = XLSX.utils.json_to_sheet(data);

      // la columna Total lleva el simbolo de la moneda de cada fila
      // (igual que en Cotizaciones), porque una fila puede estar en
      // dolares y otra en colones
      cols.forEach((c, i) => {
        if (!c.currency) return;
        const letter = excelColumnLetter(i);
        rows.forEach((s, r) => {
          const cell = worksheet[`${letter}${r + 2}`]; // la fila 1 es el encabezado
          if (cell) cell.z = `"${s.currency === "CRC" ? "₡" : "$"}"#,##0.00`;
        });
      });

      worksheet["!cols"] = cols.map((c) => ({ wch: Math.max(10, c.label.length + 4) }));

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Resumenes");

      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const file = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      saveAs(file, "ResumenesDeRecoleccion.xlsx");
    } catch {
      showError("No fue posible generar el Excel.");
    } finally {
      setExporting(false);
    }
  };

  const exportListPDF = async (selectedKeys) => {
    setExporting(true);
    try {
      const rows = await fetchAllFiltered();
      const cols = EXPORT_COLUMNS.filter((c) => selectedKeys.includes(c.key));
      const doc = new jsPDF();

      doc.setFontSize(18);
      doc.text("Listado de Resúmenes de Recolección", 14, 20);

      autoTable(doc, {
        startY: 30,
        head: [cols.map((c) => c.label)],
        body: rows.map((s) =>
          cols.map((c) => {
            if (!c.currency) return c.value(s);
            // El simbolo de colones no lo puede dibujar la fuente por
            // defecto de jsPDF, se usa el codigo "CRC" en su lugar (igual
            // que en el PDF individual del resumen)
            const prefix = s.currency === "CRC" ? "CRC " : "$";
            return `${prefix}${Number(c.value(s)).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
          })
        ),
      });

      doc.save("ResumenesDeRecoleccion.pdf");
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
          className="rounded-xl bg-summary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-summary-strong"
        >
          + Nuevo resumen
        </button>
      </div>

      {/* FILTROS */}
      <div className="mb-5 flex flex-wrap gap-3 rounded-2xl border border-edge bg-surface p-3">
        <input
          type="text"
          placeholder="Buscar por periodo o empresa..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="flex-1 min-w-[220px] rounded-xl border border-edge bg-surface-2 px-4 py-2 text-ink placeholder-ink-dim/60 focus:outline-none focus:ring-2 focus:ring-summary/40 focus:border-summary-strong transition"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-edge bg-surface-2 px-4 py-2 text-ink focus:outline-none focus:ring-2 focus:ring-summary/40 transition"
        >
          <option value="">Todos</option>
          <option value="Active">Activos</option>
          <option value="Voided">Anulados</option>
        </select>

        <div className="flex items-center gap-2">
          <label htmlFor="summary-period-from" className="text-sm text-ink-dim whitespace-nowrap">
            Periodo desde
          </label>
          <input
            id="summary-period-from"
            type="date"
            value={periodFrom}
            max={periodTo || undefined}
            onChange={(e) => setPeriodFrom(e.target.value)}
            className="rounded-xl border border-edge bg-surface-2 px-3 py-2 text-ink focus:outline-none focus:ring-2 focus:ring-summary/40 transition"
          />
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="summary-period-to" className="text-sm text-ink-dim whitespace-nowrap">
            Hasta
          </label>
          <input
            id="summary-period-to"
            type="date"
            value={periodTo}
            min={periodFrom || undefined}
            onChange={(e) => setPeriodTo(e.target.value)}
            className="rounded-xl border border-edge bg-surface-2 px-3 py-2 text-ink focus:outline-none focus:ring-2 focus:ring-summary/40 transition"
          />
        </div>

        {(periodFrom || periodTo) && (
          <button
            onClick={() => {
              setPeriodFrom("");
              setPeriodTo("");
            }}
            className="rounded-xl border border-edge bg-surface px-3 py-2 text-sm font-medium text-ink-dim transition hover:bg-surface-2"
          >
            Limpiar periodo
          </button>
        )}
      </div>

      {/* TABLA */}
      <div className="overflow-x-auto rounded-2xl border border-edge bg-surface shadow-sm">
        <table className="w-full text-ink">
          <thead className="bg-surface-2">
            <tr className="text-left text-xs font-semibold uppercase tracking-wide text-ink-dim">
              <th className="px-6 py-3.5">Empresa</th>
              <th className="px-6 py-3.5">Periodo</th>
              <th className="px-6 py-3.5">Actas</th>
              <th className="px-6 py-3.5">Total (kg)</th>
              <th className="px-6 py-3.5">Total ($)</th>
              <th className="px-6 py-3.5">Estado</th>
              <th className="px-6 py-3.5">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-ink-dim">
                  Cargando resúmenes...
                </td>
              </tr>
            ) : summaries.length > 0 ? (
              summaries.map((s) => {
                return (
                <tr key={s.id} className="border-t border-edge transition hover:bg-surface-2/60">
                  <td className="px-6 py-4">{s.company_name}</td>
                  <td className="px-6 py-4 font-data">{s.period_label}</td>
                  <td className="px-6 py-4 font-data text-ink-dim">{s.tickets.length}</td>
                  <td className="px-6 py-4 font-data">{s.total_kg.toLocaleString("es-CR")}</td>
                  <td className="px-6 py-4 font-data">
                    {s.currency === "CRC" ? "₡" : "$"}{s.total.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${
                        s.status === "Active"
                          ? "bg-summary-soft text-summary-strong"
                          : "bg-danger-soft text-danger"
                      }`}
                      title={s.status === "Voided" ? s.void_reason ?? "" : ""}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${s.status === "Active" ? "bg-summary-strong" : "bg-danger"}`} />
                      {s.status === "Active" ? "Activo" : "Anulado"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openView(s)}
                        aria-label={`Ver resumen ${s.period_label}`}
                        title={`Ver resumen ${s.period_label}`}
                        className="rounded-lg border border-edge p-2 text-ink-dim transition hover:bg-surface-2 hover:text-ink"
                      >
                        <Eye size={16} />
                      </button>

                      <button
                        onClick={() => generateCollectionSummaryPdf(toExportData(s))}
                        aria-label={`Descargar PDF del resumen ${s.period_label}`}
                        title={`Descargar PDF del resumen ${s.period_label}`}
                        className="flex items-center gap-1.5 rounded-lg border border-danger/30 bg-danger-soft px-2.5 py-2 text-xs font-semibold text-danger transition hover:bg-danger/15"
                      >
                        <FileDown size={16} />
                        PDF
                      </button>

                      <button
                        onClick={() => generateCollectionSummaryExcel(toExportData(s))}
                        aria-label={`Descargar Excel del resumen ${s.period_label}`}
                        title={`Descargar Excel del resumen ${s.period_label}`}
                        className="flex items-center gap-1.5 rounded-lg border border-success/30 bg-success-soft px-2.5 py-2 text-xs font-semibold text-success transition hover:bg-success/15"
                      >
                        <FileSpreadsheet size={16} />
                        Excel
                      </button>

                      {s.status === "Active" && (
                        <>
                          <button
                            onClick={() => openEdit(s)}
                            aria-label={`Editar resumen ${s.period_label}`}
                            title={`Editar resumen ${s.period_label}`}
                            className="rounded-lg border border-edge p-2 text-ink-dim transition hover:bg-surface-2 hover:text-ink"
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            onClick={() => setVoidTarget(s)}
                            aria-label={`Anular resumen ${s.period_label}`}
                            title={`Anular resumen ${s.period_label}`}
                            className="rounded-lg border border-danger/20 bg-danger-soft p-2 text-danger transition hover:brightness-95"
                          >
                            <Ban size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="py-10 text-center text-ink-dim">
                  No hay resúmenes registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <Pager page={page} pageSize={PAGE_SIZE} totalCount={totalCount} onPageChange={setPage} />
      </div>

      {showModal && (
        <ModalCollectionSummary
          summary={selectedSummary}
          readOnly={readOnly}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false);
            loadSummaries();
          }}
        />
      )}

      {voidTarget && (
        <ModalVoidCollectionSummary
          summary={voidTarget}
          onClose={() => setVoidTarget(null)}
          onVoided={() => {
            setVoidTarget(null);
            loadSummaries();
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
          if (format === "excel") exportExcelList(selectedKeys);
          else exportListPDF(selectedKeys);
        }}
      />
    </div>
  );
}
