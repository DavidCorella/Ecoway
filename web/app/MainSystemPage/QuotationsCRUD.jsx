"use client";

import { useEffect, useState } from "react";
import { Eye, Pencil, Ban, FileDown, FileSpreadsheet, FileText } from "lucide-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { getQuotations } from "../../services/QuotationsService";
import { showError } from "../../utils/alerts";
import ModalQuotation from "../../Components/ModalQuotation";
import ModalVoidQuotation from "../../Components/ModalVoidQuotation";
import { generateQuotationPdf } from "../../utils/quotationPdf";
import Pager from "../../Components/Pager";
import ExportColumnPicker from "../../Components/ExportColumnPicker";
import { useRealtimeRefresh } from "../../hooks/useRealtimeRefresh";
import { formatDateOnly } from "../../utils/dateOnly";

const PAGE_SIZE = 25;
const EXPORT_PAGE_SIZE = 10000;

// quotation_date es una fecha-sin-hora: se formatea sin pasar por
// conversion de zona horaria (ver utils/dateOnly), si no en Costa Rica se
// puede ver un dia antes del que en realidad es
const formatDate = formatDateOnly;

const money = (value) =>
  Number(value ?? 0).toLocaleString("es-CR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const CURRENCY_SYMBOLS = { USD: "$", CRC: "₡" };
const currencySymbol = (currency) => CURRENCY_SYMBOLS[currency] || "$";

// La fuente Helvetica que usa jsPDF por defecto no tiene el glifo del
// simbolo de colones (₡) — sale como caracter roto y descuadra toda la
// tabla. Se usa el codigo "CRC" en su lugar, solo para el PDF (en pantalla
// y en Excel el simbolo ₡ se ve bien, ahi se sigue usando currencySymbol)
const pdfCurrencySymbol = (currency) => (currency === "CRC" ? "CRC " : "$");

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

// Columnas disponibles al exportar, en el orden en que se muestran. Flete
// y Total llevan currency: true porque cada fila puede estar en una
// moneda distinta (dolares o colones)
const EXPORT_COLUMNS = [
  { key: "quotation_number", label: "No. Cotización", value: (q) => q.quotation_number },
  { key: "company_name", label: "Empresa", value: (q) => q.company_name },
  { key: "quotation_date", label: "Fecha", value: (q) => formatDate(q.quotation_date) },
  { key: "contact_name", label: "Contacto", value: (q) => q.contact_name || "" },
  { key: "currency", label: "Moneda", value: (q) => q.currency },
  { key: "freight_cost", label: "Flete", value: (q) => q.freight_cost, currency: true },
  { key: "tax_rate", label: "Impuesto (%)", value: (q) => q.tax_rate },
  { key: "total", label: "Total", value: (q) => q.total, currency: true },
  { key: "status", label: "Estado", value: (q) => (q.status === "Active" ? "Activa" : "Anulada") },
];

export default function QuotationsCRUD() {
  const [quotations, setQuotations] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState(null); // "excel" | "pdf" | null

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [readOnly, setReadOnly] = useState(false);
  const [voidTarget, setVoidTarget] = useState(null);

  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, dateFrom, dateTo]);

  const loadQuotations = async () => {
    setLoading(true);
    try {
      const data = await getQuotations({
        search,
        status: statusFilter,
        dateFrom,
        dateTo,
        page,
        pageSize: PAGE_SIZE,
      });
      setQuotations(data.items);
      setTotalCount(data.totalCount);
    } catch {
      showError("No fue posible cargar las cotizaciones.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuotations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter, dateFrom, dateTo, page]);

  useRealtimeRefresh("quotations", loadQuotations);

  const openCreate = () => {
    setSelectedQuotation(null);
    setReadOnly(false);
    setShowModal(true);
  };

  const openView = (quotation) => {
    setSelectedQuotation(quotation);
    setReadOnly(true);
    setShowModal(true);
  };

  const openEdit = (quotation) => {
    setSelectedQuotation(quotation);
    setReadOnly(false);
    setShowModal(true);
  };

  const fetchAllFiltered = async () => {
    const data = await getQuotations({
      search,
      status: statusFilter,
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

      const data = rows.map((q) => {
        const row = {};
        cols.forEach((c) => {
          row[c.label] = c.value(q);
        });
        return row;
      });

      const worksheet = XLSX.utils.json_to_sheet(data);

      // las columnas de moneda (Flete, Total) llevan el simbolo de la
      // moneda de cada fila, porque una cotizacion puede estar en dolares
      // y otra en colones
      cols.forEach((c, i) => {
        if (!c.currency) return;
        const letter = excelColumnLetter(i);
        rows.forEach((q, r) => {
          const cell = worksheet[`${letter}${r + 2}`]; // la fila 1 es el encabezado
          if (cell) cell.z = `"${currencySymbol(q.currency)}"#,##0.00`;
        });
      });

      worksheet["!cols"] = cols.map((c) => ({ wch: Math.max(10, c.label.length + 4) }));

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Cotizaciones");

      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const file = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      saveAs(file, "Cotizaciones.xlsx");
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
      doc.text("Listado de Cotizaciones", 14, 20);

      autoTable(doc, {
        startY: 30,
        head: [cols.map((c) => c.label)],
        body: rows.map((q) =>
          cols.map((c) => (c.currency ? `${pdfCurrencySymbol(q.currency)}${money(c.value(q))}` : c.value(q)))
        ),
      });

      doc.save("Cotizaciones.pdf");
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
          className="rounded-xl bg-quotes px-4 py-2.5 text-sm font-medium text-white transition hover:bg-quotes-strong"
        >
          + Nueva cotización
        </button>
      </div>

      {/* FILTROS */}
      <div className="mb-5 flex flex-wrap gap-3 rounded-2xl border border-edge bg-surface p-3">
        <input
          type="text"
          placeholder="Buscar por número o empresa..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="flex-1 min-w-[220px] rounded-xl border border-edge bg-surface-2 px-4 py-2 text-ink placeholder-ink-dim/60 focus:outline-none focus:ring-2 focus:ring-quotes/40 focus:border-quotes-strong transition"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-edge bg-surface-2 px-4 py-2 text-ink focus:outline-none focus:ring-2 focus:ring-quotes/40 transition"
        >
          <option value="">Todas</option>
          <option value="Active">Activas</option>
          <option value="Voided">Anuladas</option>
        </select>

        <div className="flex items-center gap-2">
          <label htmlFor="quotation-date-from" className="text-sm text-ink-dim whitespace-nowrap">
            Desde
          </label>
          <input
            id="quotation-date-from"
            type="date"
            value={dateFrom}
            max={dateTo || undefined}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-xl border border-edge bg-surface-2 px-3 py-2 text-ink focus:outline-none focus:ring-2 focus:ring-quotes/40 transition"
          />
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="quotation-date-to" className="text-sm text-ink-dim whitespace-nowrap">
            Hasta
          </label>
          <input
            id="quotation-date-to"
            type="date"
            value={dateTo}
            min={dateFrom || undefined}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-xl border border-edge bg-surface-2 px-3 py-2 text-ink focus:outline-none focus:ring-2 focus:ring-quotes/40 transition"
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
          <thead className="bg-surface-2">
            <tr className="text-left text-xs font-semibold uppercase tracking-wide text-ink-dim">
              <th className="px-6 py-3.5 font-data font-semibold">No. Cotización</th>
              <th className="px-6 py-3.5">Empresa</th>
              <th className="px-6 py-3.5">Fecha</th>
              <th className="px-6 py-3.5">Total</th>
              <th className="px-6 py-3.5">Estado</th>
              <th className="px-6 py-3.5">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-ink-dim">
                  Cargando cotizaciones...
                </td>
              </tr>
            ) : quotations.length > 0 ? (
              quotations.map((q) => (
                <tr key={q.id} className="border-t border-edge transition hover:bg-surface-2/60">
                  <td className="px-6 py-4 font-data font-medium">{q.quotation_number}</td>
                  <td className="px-6 py-4">{q.company_name}</td>
                  <td className="px-6 py-4 font-data text-ink-dim">{formatDate(q.quotation_date)}</td>
                  <td className="px-6 py-4 font-data">{currencySymbol(q.currency)}{money(q.total)}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${
                        q.status === "Active"
                          ? "bg-quotes-soft text-quotes-strong"
                          : "bg-danger-soft text-danger"
                      }`}
                      title={q.status === "Voided" ? q.void_reason ?? "" : ""}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${q.status === "Active" ? "bg-quotes-strong" : "bg-danger"}`} />
                      {q.status === "Active" ? "Activa" : "Anulada"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openView(q)}
                        aria-label={`Ver cotización ${q.quotation_number}`}
                        title={`Ver cotización ${q.quotation_number}`}
                        className="rounded-lg border border-edge p-2 text-ink-dim transition hover:bg-surface-2 hover:text-ink"
                      >
                        <Eye size={16} />
                      </button>

                      <button
                        onClick={() => generateQuotationPdf(q)}
                        aria-label={`Descargar PDF de la cotización ${q.quotation_number}`}
                        title={`Descargar PDF de la cotización ${q.quotation_number}`}
                        className="flex items-center gap-1.5 rounded-lg border border-danger/30 bg-danger-soft px-2.5 py-2 text-xs font-semibold text-danger transition hover:bg-danger/15"
                      >
                        <FileText size={16} />
                        PDF
                      </button>

                      {q.status === "Active" && (
                        <>
                          <button
                            onClick={() => openEdit(q)}
                            aria-label={`Editar cotización ${q.quotation_number}`}
                            title={`Editar cotización ${q.quotation_number}`}
                            className="rounded-lg border border-edge p-2 text-ink-dim transition hover:bg-surface-2 hover:text-ink"
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            onClick={() => setVoidTarget(q)}
                            aria-label={`Anular cotización ${q.quotation_number}`}
                            title={`Anular cotización ${q.quotation_number}`}
                            className="rounded-lg border border-danger/20 bg-danger-soft p-2 text-danger transition hover:brightness-95"
                          >
                            <Ban size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-10 text-center text-ink-dim">
                  No hay cotizaciones registradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <Pager page={page} pageSize={PAGE_SIZE} totalCount={totalCount} onPageChange={setPage} />
      </div>

      {showModal && (
        <ModalQuotation
          quotation={selectedQuotation}
          readOnly={readOnly}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false);
            loadQuotations();
          }}
        />
      )}

      {voidTarget && (
        <ModalVoidQuotation
          quotation={voidTarget}
          onClose={() => setVoidTarget(null)}
          onVoided={() => {
            setVoidTarget(null);
            loadQuotations();
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
          else exportListPDF(selectedKeys);
        }}
      />
    </div>
  );
}
