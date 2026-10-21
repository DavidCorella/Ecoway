"use client";

import { useEffect, useState } from "react";
import { X, FileDown, FileText } from "lucide-react";
import SearchSelect from "./SearchSelect";
import {
  getNextCertificateNumber,
  createCertificate,
  editCertificate,
} from "../services/CertificatesService";
import { getCompanies, getTickets } from "../services/TicketsService";
import { showSuccess, showError, showConfirm } from "../utils/alerts";
import { generateCertificatePdf } from "../utils/certificatePdf";
import { generateCertificateExcel } from "../utils/certificateExcel";
import { parseDateOnly, formatDateOnly } from "../utils/dateOnly";

const today = () => new Date().toISOString().slice(0, 10);

// Quien firma los certificados es siempre la misma persona, fijo tanto
// aca como en el backend (CertificateRule)
const FIXED_SIGNER_NAME = "Ing. Carlos Andrés Rincón Apráez";
const FIXED_SIGNER_POSITION = "Gerente general";

const emptyForm = () => ({
  // se asigna solo, no aparece en el formulario
  certificate_number: "",
  company_id: "",
  // "Certificado emitido el" se sugiere con la fecha de hoy, pero se puede editar
  issued_date: today(),
  contact_name: "",
  contact_position: "",
  contact_phone: "",
  contact_cell: "",
  contact_email: "",
});

// Suma los kilos por material entre todas las actas marcadas, no es editable a mano
const aggregateItems = (ticketIds, tickets) => {
  const totals = new Map();

  ticketIds.forEach((id) => {
    const ticket = tickets.find((t) => t.id === id);
    ticket?.items?.forEach((i) => {
      const key = i.material_description;
      totals.set(key, (totals.get(key) || 0) + (Number(i.quantity_kg) || 0));
    });
  });

  return Array.from(totals.entries()).map(([material_description, quantity_kg]) => ({
    material_description,
    quantity_kg: String(Math.round(quantity_kg * 100) / 100),
  }));
};

export default function ModalCertificate({ certificate, readOnly, onClose, onSaved }) {
  const isEdit = !!certificate && !readOnly;

  const [companies, setCompanies] = useState([]);
  const [tickets, setTickets] = useState([]);

  const [form, setForm] = useState(emptyForm());
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedTicketIds, setSelectedTicketIds] = useState([]);
  const [items, setItems] = useState([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    getCompanies()
      .then((data) =>
        setCompanies(
          // Solo empresas activas, salvo la que ya tenia el certificado si
          // esta en edicion
          data
            .filter((c) => c.is_active || c.id === certificate?.company_id)
            .map((c) => ({
              ...c,
              label: c.project ? `${c.nombre_comercial} — ${c.project}` : c.nombre_comercial,
            }))
        )
      )
      .catch(() => showError("No fue posible cargar las empresas."));

    getTickets()
      .then(setTickets)
      .catch(() => showError("No fue posible cargar las actas."));
  }, []);

  useEffect(() => {
    if (certificate) {
      setForm({
        certificate_number: certificate.certificate_number ?? "",
        company_id: certificate.company_id ?? "",
        issued_date: certificate.issued_date?.slice(0, 10) ?? "",
        contact_name: certificate.contact_name ?? "",
        contact_position: certificate.contact_position ?? "",
        contact_phone: certificate.contact_phone ?? "",
        contact_cell: certificate.contact_cell ?? "",
        contact_email: certificate.contact_email ?? "",
      });
      // El rango del certificado es el mismo que se uso para elegir las
      // actas: se precarga aca para poder editarlo despues
      setDateFrom(certificate.certificate_date_from?.slice(0, 10) ?? "");
      setDateTo(certificate.certificate_date_to?.slice(0, 10) ?? "");
      setSelectedTicketIds(certificate.ticket_ids ?? []);
      setItems(
        (certificate.items ?? []).map((i) => ({
          material_description: i.material_description ?? "",
          quantity_kg: i.quantity_kg ?? "",
        }))
      );
    } else {
      getNextCertificateNumber()
        .then((number) => setForm((prev) => ({ ...prev, certificate_number: number })))
        .catch(() => {});
    }
  }, [certificate]);

  // el contacto se llena solo con los datos de la empresa elegida
  const handleCompanySelect = (companyId) => {
    const selectedCompany = companies.find((c) => c.id === companyId);

    setForm((prev) => ({
      ...prev,
      company_id: companyId,
      contact_name: selectedCompany?.contact_name ?? "",
      contact_position: selectedCompany?.contact_position ?? "",
      contact_phone: selectedCompany?.contact_phone ?? "",
      contact_cell: selectedCompany?.contact_cell ?? "",
      contact_email: selectedCompany?.email ?? "",
    }));
    setSelectedTicketIds([]);
    setItems([]);
    setFieldErrors((prev) => ({
      ...prev,
      company_id: "",
      contact_name: "",
      contact_position: "",
      contact_phone: "",
      contact_cell: "",
      contact_email: "",
    }));
  };

  const candidateTickets = tickets.filter((t) => {
    if (t.company_id !== form.company_id || t.status !== "Active") return false;
    // ticket_date es una fecha-sin-hora: se compara con parseDateOnly (sin
    // pasar por zona horaria), si no una acta justo en el limite del
    // rango podia quedar afuera por el desfase UTC/hora local
    const ticketDate = parseDateOnly(t.ticket_date);
    if (dateFrom && (!ticketDate || ticketDate < parseDateOnly(dateFrom))) return false;
    if (dateTo && (!ticketDate || ticketDate > parseDateOnly(dateTo))) return false;
    return true;
  });

  const toggleTicket = (ticketId) => {
    setSelectedTicketIds((prev) => {
      const next = prev.includes(ticketId)
        ? prev.filter((id) => id !== ticketId)
        : [...prev, ticketId];

      setItems(aggregateItems(next, tickets));
      clearFieldError("tickets");
      return next;
    });
  };

  // Si ya estan todas las candidatas marcadas, el checkbox del encabezado
  // las destilda a todas; si no, marca las que falten
  const allCandidatesSelected =
    candidateTickets.length > 0 &&
    candidateTickets.every((t) => selectedTicketIds.includes(t.id));

  const toggleAllTickets = () => {
    const next = allCandidatesSelected
      ? selectedTicketIds.filter((id) => !candidateTickets.some((t) => t.id === id))
      : [...new Set([...selectedTicketIds, ...candidateTickets.map((t) => t.id)])];

    setSelectedTicketIds(next);
    setItems(aggregateItems(next, tickets));
    clearFieldError("tickets");
  };

  const totalKg = items.reduce((sum, i) => sum + (Number(i.quantity_kg) || 0), 0);

  const clearFieldError = (field) =>
    setFieldErrors((prev) => (prev[field] ? { ...prev, [field]: "" } : prev));

  const validate = () => {
    const newErrors = {};

    // certificate_number e issued_date se asignan solos, no hay campo
    // para ellos en el formulario
    if (!form.certificate_number.trim()) {
      setError("No fue posible generar el número interno. Cerrá y volvé a abrir el formulario.");
      return false;
    }

    if (!form.company_id) newErrors.company_id = "Debe seleccionar una empresa.";
    if (!dateFrom || !dateTo) newErrors.certificate_dates = "El período del certificado (desde / hasta) es obligatorio.";
    if (!form.issued_date) newErrors.issued_date = "La fecha de emisión es obligatoria.";

    if (!form.contact_name.trim()) newErrors.contact_name = "El nombre del contacto es obligatorio.";
    if (!form.contact_position.trim()) newErrors.contact_position = "El cargo es obligatorio.";
    if (!form.contact_phone.trim()) newErrors.contact_phone = "El teléfono es obligatorio.";
    if (!form.contact_cell.trim()) newErrors.contact_cell = "El celular es obligatorio.";
    if (!form.contact_email.trim()) newErrors.contact_email = "El correo electrónico es obligatorio.";

    if (selectedTicketIds.length === 0) newErrors.tickets = "Debe seleccionar al menos un acta.";
    else if (items.length === 0) newErrors.tickets = "Las actas elegidas no tienen materiales para incluir.";

    setFieldErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const buildPayload = () => ({
    id: certificate?.id,
    certificate_number: form.certificate_number,
    company_id: form.company_id,
    certificate_date_from: dateFrom,
    certificate_date_to: dateTo,
    issued_date: form.issued_date,
    // Obligatorios (validate() ya bloqueó el guardado si faltaba alguno)
    contact_name: form.contact_name,
    contact_position: form.contact_position,
    contact_phone: form.contact_phone,
    contact_cell: form.contact_cell,
    contact_email: form.contact_email,
    ticket_ids: selectedTicketIds,
    items: items.map((i) => ({
      material_description: i.material_description,
      quantity_kg: Number(i.quantity_kg) || 0,
    })),
  });

  const handleSave = async () => {
    setError("");
    if (!validate()) return;

    const contactResult = await showConfirm(
      "¿Los datos de contacto son correctos?",
      `${form.contact_name} — ${form.contact_position}. Tel: ${form.contact_phone} / Cel: ${form.contact_cell} / ${form.contact_email}. Revisalos antes de continuar.`
    );
    if (!contactResult.isConfirmed) return;

    const confirmResult = await showConfirm(
      isEdit ? "¿Guardar cambios?" : "¿Crear certificado?",
      isEdit
        ? `Se actualizará el certificado ${form.certificate_number} — ${totalKg.toLocaleString("es-CR")} kg en total.`
        : `Se creará el certificado ${form.certificate_number} por ${totalKg.toLocaleString("es-CR")} kg en total.`
    );
    if (!confirmResult.isConfirmed) return;

    const payload = buildPayload();

    setSaving(true);
    try {
      if (isEdit) {
        await editCertificate(payload);
        await showSuccess("Certificado actualizado correctamente.");
      } else {
        await createCertificate(payload);
        await showSuccess("Certificado creado correctamente.");
      }
      onSaved?.();
    } catch (err) {
      let message = "Error al guardar el certificado.";
      try {
        message = JSON.parse(err.message).message;
      } catch {
        message = err.message || message;
      }

      // si dos personas tomaron el mismo numero al mismo tiempo, se pide
      // uno nuevo en vez de dejar al usuario trabado
      if (!isEdit && message === "Ya existe un certificado con ese número.") {
        try {
          const fresh = await getNextCertificateNumber();
          setForm((prev) => ({ ...prev, certificate_number: fresh }));
          message = `Ese número ya lo tomó otro certificado creado al mismo tiempo. Se generó el número ${fresh}, revisá y guardá de nuevo.`;
        } catch {
          // si ni siquiera se pudo traer un numero nuevo, se deja el mensaje original
        }
      }

      setError(message);
      showError(message);
    } finally {
      setSaving(false);
    }
  };

  const buildExportData = () => {
    const selectedCompany = companies.find((c) => c.id === form.company_id);
    const ticketNumbers = selectedTicketIds
      .map((id) => tickets.find((t) => t.id === id)?.ticket_number)
      .filter(Boolean);

    return {
      certificate_number: form.certificate_number || "—",
      company_name: certificate?.company_name ?? selectedCompany?.name ?? "",
      company_address: certificate?.company_address ?? selectedCompany?.address ?? "",
      contact_name: form.contact_name,
      contact_position: form.contact_position,
      contact_phone: form.contact_phone,
      contact_cell: form.contact_cell,
      contact_email: form.contact_email,
      certificate_date_from: dateFrom,
      certificate_date_to: dateTo,
      issued_date: form.issued_date,
      signer_name: certificate?.signer_name ?? FIXED_SIGNER_NAME,
      signer_position: certificate?.signer_position ?? FIXED_SIGNER_POSITION,
      created_by_display: certificate?.created_by_display ?? "",
      total_kg: totalKg,
      ticket_numbers: certificate?.ticket_numbers ?? ticketNumbers,
      items,
    };
  };

  const inputClass = (extra = "", hasError = false) =>
    `w-full rounded-xl border bg-surface-2 px-4 py-2.5 text-sm text-ink outline-none transition focus:bg-surface disabled:opacity-70 ${
      hasError
        ? "border-danger"
        : "border-edge focus:border-certs-strong focus:ring-2 focus:ring-certs/30"
    } ${extra}`;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-brand-900/55 backdrop-blur-sm p-4">
      <div className="w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-2xl border border-edge bg-surface shadow-2xl">
        {/* HEADER */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-edge bg-surface px-6 py-5">
          <div>
            <span className="eyebrow text-certs-strong">Certificados</span>
            <h2 className="text-xl font-semibold text-ink -mt-0.5">
              {readOnly
                ? `Certificado ${certificate?.certificate_number}`
                : isEdit
                ? "Editar certificado"
                : "Nuevo certificado"}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {/* Solo tiene sentido exportar un certificado que ya existe. */}
            {certificate && (
              <>
                <button
                  onClick={() => generateCertificateExcel(buildExportData())}
                  className="flex items-center gap-2 rounded-xl border border-success/30 bg-success-soft px-3 py-2 text-sm font-semibold text-success transition hover:bg-success/15"
                >
                  <FileText size={16} />
                  Excel
                </button>
                <button
                  onClick={() => generateCertificatePdf(buildExportData())}
                  className="flex items-center gap-2 rounded-xl border border-danger/30 bg-danger-soft px-3 py-2 text-sm font-semibold text-danger transition hover:bg-danger/15"
                >
                  <FileDown size={16} />
                  PDF
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-ink-dim transition hover:bg-surface-2 hover:text-ink"
              aria-label="Cerrar"
              title="Cerrar"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {readOnly && certificate?.status === "Voided" && (
            <div className="rounded-lg border border-danger/20 bg-danger-soft px-4 py-3">
              <p className="text-sm font-medium text-danger">Certificado anulado</p>
              <p className="text-sm text-danger/90 mt-0.5">{certificate.void_reason}</p>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-danger/20 bg-danger-soft px-4 py-3">
              <p className="text-sm text-danger">{error}</p>
            </div>
          )}

          {/* DATOS GENERALES */}
          {/* El número de certificado es solo interno (para el listado) —
              se asigna solo y no aparece acá. El período (desde/hasta) se
              elige junto con las actas, mas abajo; acá en modo lectura
              solo se muestra. */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              {readOnly ? (
                <div>
                  <label className="mb-2 block text-sm font-medium text-ink-dim">Empresa (cliente)</label>
                  <input disabled value={certificate?.company_name ?? ""} className={inputClass()} />
                </div>
              ) : (
                <SearchSelect
                  label="Empresa (cliente) *"
                  accent="certs"
                  options={companies}
                  value={form.company_id}
                  valueField="id"
                  labelField="label"
                  error={fieldErrors.company_id}
                  onChange={handleCompanySelect}
                />
              )}
            </div>

            <div>
              <label htmlFor="cert-issued-date" className="mb-2 block text-sm font-medium text-ink-dim">
                Emitido el {!readOnly && <span className="text-danger">*</span>}
              </label>
              <input
                id="cert-issued-date"
                type="date"
                disabled={readOnly}
                value={form.issued_date}
                onChange={(e) => {
                  setForm({ ...form, issued_date: e.target.value });
                  clearFieldError("issued_date");
                }}
                className={inputClass("font-data", !!fieldErrors.issued_date)}
              />
              {fieldErrors.issued_date && (
                <p className="mt-1 text-sm text-danger">{fieldErrors.issued_date}</p>
              )}
            </div>

            {readOnly && (
              <div>
                <label className="mb-2 block text-sm font-medium text-ink-dim">Período certificado</label>
                <input
                  disabled
                  value={
                    dateFrom && dateTo
                      ? `${formatDateOnly(dateFrom)} — ${formatDateOnly(dateTo)}`
                      : "—"
                  }
                  className={inputClass("font-data")}
                />
              </div>
            )}
          </div>

          {/* CONTACTO */}
          <div>
            <p className="mb-2 text-sm font-medium text-ink-dim">
              Datos de contacto {!readOnly && <span className="text-danger">*</span>}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <input
                  type="text"
                  disabled={readOnly}
                  value={form.contact_name}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, contact_name: e.target.value }));
                    clearFieldError("contact_name");
                  }}
                  placeholder="Se completa según la empresa"
                  className={inputClass("", !!fieldErrors.contact_name)}
                />
                {fieldErrors.contact_name && <p className="mt-1 text-sm text-danger">{fieldErrors.contact_name}</p>}
              </div>
              <div>
                <input
                  type="text"
                  disabled={readOnly}
                  value={form.contact_position}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, contact_position: e.target.value }));
                    clearFieldError("contact_position");
                  }}
                  placeholder="Se completa según la empresa"
                  className={inputClass("", !!fieldErrors.contact_position)}
                />
                {fieldErrors.contact_position && <p className="mt-1 text-sm text-danger">{fieldErrors.contact_position}</p>}
              </div>
              <div>
                <input
                  type="text"
                  disabled={readOnly}
                  value={form.contact_phone}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, contact_phone: e.target.value.replace(/[^0-9]/g, "") }));
                    clearFieldError("contact_phone");
                  }}
                  placeholder="Se completa según la empresa"
                  className={inputClass("", !!fieldErrors.contact_phone)}
                />
                {fieldErrors.contact_phone && <p className="mt-1 text-sm text-danger">{fieldErrors.contact_phone}</p>}
              </div>
              <div>
                <input
                  type="text"
                  disabled={readOnly}
                  value={form.contact_cell}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, contact_cell: e.target.value.replace(/[^0-9]/g, "") }));
                    clearFieldError("contact_cell");
                  }}
                  placeholder="Se completa según la empresa"
                  className={inputClass("", !!fieldErrors.contact_cell)}
                />
                {fieldErrors.contact_cell && <p className="mt-1 text-sm text-danger">{fieldErrors.contact_cell}</p>}
              </div>
              <div>
                <input
                  type="email"
                  disabled={readOnly}
                  value={form.contact_email}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, contact_email: e.target.value }));
                    clearFieldError("contact_email");
                  }}
                  placeholder="Se completa según la empresa"
                  className={inputClass("", !!fieldErrors.contact_email)}
                />
                {fieldErrors.contact_email && <p className="mt-1 text-sm text-danger">{fieldErrors.contact_email}</p>}
              </div>
            </div>
          </div>

          {/* SELECCIÓN DE ACTAS */}
          {!readOnly && (
            <div>
              <p className="mb-2 text-sm font-medium text-ink-dim">
                Actas a incluir {!readOnly && <span className="text-danger">*</span>}
              </p>

              <div className="mb-3 flex flex-wrap items-center gap-3 rounded-xl border border-edge bg-surface-2 p-3">
                <div className="flex items-center gap-2">
                  <label htmlFor="cert-date-from" className="text-sm text-ink-dim whitespace-nowrap">
                    Desde <span className="text-danger">*</span>
                  </label>
                  <input
                    id="cert-date-from"
                    type="date"
                    value={dateFrom}
                    max={dateTo || undefined}
                    onChange={(e) => {
                      setDateFrom(e.target.value);
                      clearFieldError("certificate_dates");
                    }}
                    className="rounded-xl border border-edge bg-surface px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-certs/40 transition"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label htmlFor="cert-date-to" className="text-sm text-ink-dim whitespace-nowrap">
                    Hasta <span className="text-danger">*</span>
                  </label>
                  <input
                    id="cert-date-to"
                    type="date"
                    value={dateTo}
                    min={dateFrom || undefined}
                    onChange={(e) => {
                      setDateTo(e.target.value);
                      clearFieldError("certificate_dates");
                    }}
                    className="rounded-xl border border-edge bg-surface px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-certs/40 transition"
                  />
                </div>
                <span className="text-xs text-ink-dim">
                  {form.company_id
                    ? "Este es el período del certificado — también filtra las actas activas de esta empresa que podés marcar."
                    : "Elegí primero la empresa."}
                </span>
              </div>

              {fieldErrors.certificate_dates && <p className="mb-2 text-sm text-danger">{fieldErrors.certificate_dates}</p>}
              {fieldErrors.tickets && <p className="mb-2 text-sm text-danger">{fieldErrors.tickets}</p>}

              <div className="max-h-56 overflow-y-auto rounded-xl border border-edge">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-surface-2">
                    <tr className="text-left text-xs font-semibold uppercase tracking-wide text-ink-dim">
                      <th className="p-3 w-10">
                        {candidateTickets.length > 0 && (
                          <input
                            type="checkbox"
                            checked={allCandidatesSelected}
                            onChange={toggleAllTickets}
                            aria-label="Seleccionar todas las actas"
                            title="Seleccionar todas las actas"
                            className="h-4 w-4 cursor-pointer accent-certs"
                          />
                        )}
                      </th>
                      <th className="p-3">No. Acta</th>
                      <th className="p-3">Fecha</th>
                      <th className="p-3">Total (kg)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {candidateTickets.length > 0 ? (
                      candidateTickets.map((t) => (
                        <tr
                          key={t.id}
                          className="cursor-pointer border-t border-edge transition hover:bg-surface-2/60"
                          onClick={() => toggleTicket(t.id)}
                        >
                          <td className="p-3">
                            <input
                              type="checkbox"
                              checked={selectedTicketIds.includes(t.id)}
                              onChange={() => toggleTicket(t.id)}
                              onClick={(e) => e.stopPropagation()}
                              aria-label={`Incluir acta ${t.ticket_number} en el certificado`}
                              title={`Incluir acta ${t.ticket_number} en el certificado`}
                              className="h-4 w-4 cursor-pointer accent-certs"
                            />
                          </td>
                          <td className="p-3 font-data">{t.ticket_number}</td>
                          <td className="p-3 font-data text-ink-dim">
                            {formatDateOnly(t.ticket_date)}
                          </td>
                          <td className="p-3 font-data">{t.total_kg.toLocaleString("es-CR")}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-ink-dim">
                          {form.company_id ? "No hay actas activas en ese rango." : "—"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* MATERIALES AGREGADOS — no editables: salen solos de las actas
              marcadas arriba, para que el certificado siempre refleje lo
              que de verdad se recolectó. */}
          <div>
            <label className="mb-2 block text-sm font-medium text-ink-dim">
              Materiales del certificado
            </label>

            <div className="overflow-x-auto rounded-xl border border-edge">
              <table className="w-full text-sm">
                <thead className="bg-surface-2">
                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-ink-dim">
                    <th className="p-3">Residuo</th>
                    <th className="p-3">Cantidad (kg)</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length > 0 ? (
                    items.map((item, index) => (
                      <tr key={index} className="border-t border-edge">
                        <td className="p-3 text-ink">{item.material_description}</td>
                        <td className="p-3 font-data text-ink">{item.quantity_kg}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={2} className="py-6 text-center text-ink-dim">
                        Marcá actas arriba para traer los materiales.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {fieldErrors.tickets && <p className="mt-2 text-sm text-danger">{fieldErrors.tickets}</p>}

            <div className="mt-2 flex justify-end">
              <span className="font-data text-sm font-semibold text-ink">
                Total: {totalKg.toLocaleString("es-CR")} kg
              </span>
            </div>
          </div>

          {/* FIRMA — siempre es la misma persona y la misma foto, no se
              elige ni se sube nada aca */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-edge bg-surface-2 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-ink">{certificate?.signer_name ?? FIXED_SIGNER_NAME}</p>
              <p className="text-xs text-ink-dim">{certificate?.signer_position ?? FIXED_SIGNER_POSITION}</p>
            </div>
            {certificate?.created_by_display && (
              <p className="text-xs text-ink-dim">Generado por: {certificate.created_by_display}</p>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-edge bg-surface-2 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm font-medium text-ink-dim transition hover:bg-surface"
          >
            {readOnly ? "Cerrar" : "Cancelar"}
          </button>

          {!readOnly && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-xl bg-certs px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-certs-strong disabled:opacity-60"
            >
              {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear certificado"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
