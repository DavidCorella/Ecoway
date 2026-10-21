"use client";

import { useEffect, useState } from "react";
import { Eye, Pencil, Ban, FileDown, FileText, FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { getCertificates } from "../../services/CertificatesService";
import { showError } from "../../utils/alerts";
import ModalCertificate from "../../Components/ModalCertificate";
import ModalVoidCertificate from "../../Components/ModalVoidCertificate";
import { generateCertificatePdf } from "../../utils/certificatePdf";
import { generateCertificateExcel } from "../../utils/certificateExcel";
import Pager from "../../Components/Pager";
import ExportColumnPicker from "../../Components/ExportColumnPicker";
import { useRealtimeRefresh } from "../../hooks/useRealtimeRefresh";
import { formatDateOnly } from "../../utils/dateOnly";

const PAGE_SIZE = 25;
const EXPORT_PAGE_SIZE = 10000;

// certificate_date_from/_to e issued_date son fechas-sin-hora: se
// formatean sin pasar por conversion de zona horaria (ver utils/dateOnly),
// si no en Costa Rica se pueden ver un dia antes del que en realidad son
const formatDate = formatDateOnly;

// Columnas disponibles al exportar el listado, en el orden en que se
// muestran (no confundir con generateCertificatePdf/Excel, que generan el
// certificado individual de cada fila, no la tabla)
const EXPORT_COLUMNS = [
  { key: "certificate_number", label: "No. Certificado", value: (c) => c.certificate_number },
  { key: "company_name", label: "Empresa", value: (c) => c.company_name },
  { key: "certificate_date_from", label: "Desde", value: (c) => formatDate(c.certificate_date_from) },
  { key: "certificate_date_to", label: "Hasta", value: (c) => formatDate(c.certificate_date_to) },
  { key: "issued_date", label: "Emitido el", value: (c) => formatDate(c.issued_date) },
  { key: "ticket_numbers", label: "Boleta(s)", value: (c) => c.ticket_numbers.join(", ") },
  { key: "total_kg", label: "Total (kg)", value: (c) => c.total_kg },
  { key: "status", label: "Estado", value: (c) => (c.status === "Active" ? "Activo" : "Anulado") },
];

export default function CertificatesCRUD() {
  const [certificates, setCertificates] = useState([]);
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
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [readOnly, setReadOnly] = useState(false);
  const [voidTarget, setVoidTarget] = useState(null);

  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, dateFrom, dateTo]);

  const loadCertificates = async () => {
    setLoading(true);
    try {
      const data = await getCertificates({
        search,
        status: statusFilter,
        dateFrom,
        dateTo,
        page,
        pageSize: PAGE_SIZE,
      });
      setCertificates(data.items);
      setTotalCount(data.totalCount);
    } catch {
      showError("No fue posible cargar los certificados.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCertificates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter, dateFrom, dateTo, page]);

  useRealtimeRefresh("certificates", loadCertificates);

  const openCreate = () => {
    setSelectedCertificate(null);
    setReadOnly(false);
    setShowModal(true);
  };

  const openView = (certificate) => {
    setSelectedCertificate(certificate);
    setReadOnly(true);
    setShowModal(true);
  };

  const openEdit = (certificate) => {
    setSelectedCertificate(certificate);
    setReadOnly(false);
    setShowModal(true);
  };

  const fetchAllFiltered = async () => {
    const data = await getCertificates({
      search,
      status: statusFilter,
      dateFrom,
      dateTo,
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

      const data = rows.map((c) => {
        const row = {};
        cols.forEach((col) => {
          row[col.label] = col.value(c);
        });
        return row;
      });

      const worksheet = XLSX.utils.json_to_sheet(data);
      worksheet["!cols"] = cols.map((c) => ({ wch: Math.max(10, c.label.length + 4) }));
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Certificados");

      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const file = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      saveAs(file, "Certificados.xlsx");
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
      doc.text("Listado de Certificados", 14, 20);

      autoTable(doc, {
        startY: 30,
        head: [cols.map((c) => c.label)],
        body: rows.map((c) => cols.map((col) => col.value(c))),
      });

      doc.save("Certificados.pdf");
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
          className="rounded-xl bg-certs px-4 py-2.5 text-sm font-medium text-white transition hover:bg-certs-strong"
        >
          + Nuevo certificado
        </button>
      </div>

      {/* FILTROS */}
      <div className="mb-5 flex flex-wrap gap-3 rounded-2xl border border-edge bg-surface p-3">
        <input
          type="text"
          placeholder="Buscar por número o empresa..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="flex-1 min-w-[220px] rounded-xl border border-edge bg-surface-2 px-4 py-2 text-ink placeholder-ink-dim/60 focus:outline-none focus:ring-2 focus:ring-certs/40 focus:border-certs-strong transition"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-edge bg-surface-2 px-4 py-2 text-ink focus:outline-none focus:ring-2 focus:ring-certs/40 transition"
        >
          <option value="">Todos</option>
          <option value="Active">Activos</option>
          <option value="Voided">Anulados</option>
        </select>

        <div className="flex items-center gap-2">
          <label htmlFor="certificate-date-from" className="text-sm text-ink-dim whitespace-nowrap">
            Desde
          </label>
          <input
            id="certificate-date-from"
            type="date"
            value={dateFrom}
            max={dateTo || undefined}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-xl border border-edge bg-surface-2 px-3 py-2 text-ink focus:outline-none focus:ring-2 focus:ring-certs/40 transition"
          />
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="certificate-date-to" className="text-sm text-ink-dim whitespace-nowrap">
            Hasta
          </label>
          <input
            id="certificate-date-to"
            type="date"
            value={dateTo}
            min={dateFrom || undefined}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-xl border border-edge bg-surface-2 px-3 py-2 text-ink focus:outline-none focus:ring-2 focus:ring-certs/40 transition"
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
              <th className="px-6 py-3.5 font-data font-semibold">No. Certificado</th>
              <th className="px-6 py-3.5">Empresa</th>
              <th className="px-6 py-3.5">Período</th>
              <th className="px-6 py-3.5">Boleta(s)</th>
              <th className="px-6 py-3.5">Total (kg)</th>
              <th className="px-6 py-3.5">Estado</th>
              <th className="px-6 py-3.5">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-ink-dim">
                  Cargando certificados...
                </td>
              </tr>
            ) : certificates.length > 0 ? (
              certificates.map((c) => (
                <tr key={c.id} className="border-t border-edge transition hover:bg-surface-2/60">
                  <td className="px-6 py-4 font-data font-medium">{c.certificate_number}</td>
                  <td className="px-6 py-4">{c.company_name}</td>
                  <td className="px-6 py-4 font-data text-ink-dim">
                    {formatDate(c.certificate_date_from)} — {formatDate(c.certificate_date_to)}
                  </td>
                  <td className="px-6 py-4 font-data text-ink-dim">{c.ticket_numbers.join(", ")}</td>
                  <td className="px-6 py-4 font-data">{c.total_kg.toLocaleString("es-CR")}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${
                        c.status === "Active"
                          ? "bg-certs-soft text-certs-strong"
                          : "bg-danger-soft text-danger"
                      }`}
                      title={c.status === "Voided" ? c.void_reason ?? "" : ""}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${c.status === "Active" ? "bg-certs-strong" : "bg-danger"}`} />
                      {c.status === "Active" ? "Activo" : "Anulado"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openView(c)}
                        aria-label={`Ver certificado ${c.certificate_number}`}
                        title={`Ver certificado ${c.certificate_number}`}
                        className="rounded-lg border border-edge p-2 text-ink-dim transition hover:bg-surface-2 hover:text-ink"
                      >
                        <Eye size={16} />
                      </button>

                      <button
                        onClick={() => generateCertificatePdf(c)}
                        aria-label={`Descargar PDF del certificado ${c.certificate_number}`}
                        title={`Descargar PDF del certificado ${c.certificate_number}`}
                        className="flex items-center gap-1.5 rounded-lg border border-danger/30 bg-danger-soft px-2.5 py-2 text-xs font-semibold text-danger transition hover:bg-danger/15"
                      >
                        <FileText size={16} />
                        PDF
                      </button>

                      <button
                        onClick={() => generateCertificateExcel(c)}
                        aria-label={`Descargar Excel del certificado ${c.certificate_number}`}
                        title={`Descargar Excel del certificado ${c.certificate_number}`}
                        className="flex items-center gap-1.5 rounded-lg border border-success/30 bg-success-soft px-2.5 py-2 text-xs font-semibold text-success transition hover:bg-success/15"
                      >
                        <FileSpreadsheet size={16} />
                        Excel
                      </button>

                      {c.status === "Active" && (
                        <>
                          <button
                            onClick={() => openEdit(c)}
                            aria-label={`Editar certificado ${c.certificate_number}`}
                            title={`Editar certificado ${c.certificate_number}`}
                            className="rounded-lg border border-edge p-2 text-ink-dim transition hover:bg-surface-2 hover:text-ink"
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            onClick={() => setVoidTarget(c)}
                            aria-label={`Anular certificado ${c.certificate_number}`}
                            title={`Anular certificado ${c.certificate_number}`}
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
                <td colSpan={7} className="py-10 text-center text-ink-dim">
                  No hay certificados registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <Pager page={page} pageSize={PAGE_SIZE} totalCount={totalCount} onPageChange={setPage} />
      </div>

      {showModal && (
        <ModalCertificate
          certificate={selectedCertificate}
          readOnly={readOnly}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false);
            loadCertificates();
          }}
        />
      )}

      {voidTarget && (
        <ModalVoidCertificate
          certificate={voidTarget}
          onClose={() => setVoidTarget(null)}
          onVoided={() => {
            setVoidTarget(null);
            loadCertificates();
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
