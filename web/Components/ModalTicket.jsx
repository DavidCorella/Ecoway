"use client";

import { useEffect, useRef, useState } from "react";
import { X, Plus, Trash2, Upload, ImageIcon, Maximize2 } from "lucide-react";
import SearchSelect from "./SearchSelect";
import ImageLightbox from "./ImageLightbox";
import {
  getCompanies,
  getTickets,
  createTicket,
  editTicket,
  uploadTicketImage,
  ticketImageUrl,
} from "../services/TicketsService";
import { getMaterials } from "../services/MaterialsService";
import { getActiveResponsibles } from "../services/userServiceAPI";
import { showSuccess, showError, showConfirm } from "../utils/alerts";

// material_id solo se usa para el desplegable, lo que se guarda es la
// descripcion y el estado fisico ya resueltos
const emptyItem = () => ({
  material_id: "",
  material_description: "",
  quantity_kg: "",
  physical_state: "",
  is_locked: false,
});

// Deja pasar solo digitos y un punto decimal mientras se escribe
const sanitizeDecimal = (value) => {
  const cleaned = value.replace(/[^0-9.]/g, "");
  const firstDot = cleaned.indexOf(".");
  if (firstDot === -1) return cleaned;
  return (
    cleaned.slice(0, firstDot + 1) +
    cleaned.slice(firstDot + 1).replace(/\./g, "")
  );
};

export default function ModalTicket({ ticket, readOnly, onClose, onSaved }) {
  const isEdit = !!ticket && !readOnly;
  const fileInputRef = useRef(null);

  const [companies, setCompanies] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [ecowayUsers, setEcowayUsers] = useState([]);
  const [form, setForm] = useState({
    ticket_number: "",
    company_id: "",
    // vacia, que la elija quien registra el acta
    ticket_date: "",
    client_responsible_name: "",
    client_responsible_id: "",
    ecoway_responsible_name: "",
    ecoway_responsible_id: "",
    image_path: "",
    // cuantos viajes de flete hizo falta para recolectar esta acta
    freight_count: "0",
  });
  const [items, setItems] = useState([emptyItem()]);
  const [uploading, setUploading] = useState(false);
  const [showImageLightbox, setShowImageLightbox] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [itemErrors, setItemErrors] = useState([]);

  useEffect(() => {
    getCompanies()
      .then((data) =>
        setCompanies(
          // Solo empresas activas, salvo la que ya tenia el acta (si esta
          // en edicion), para no romper el selector con una que se inactivo
          data
            .filter((c) => c.is_active || c.id === ticket?.company_id)
            // si tiene proyecto se muestra junto al nombre, para distinguir
            // empresas repetidas con distinto proyecto
            .map((c) => ({
              ...c,
              label: c.project ? `${c.nombre_comercial} — ${c.project}` : c.nombre_comercial,
            }))
        )
      )
      .catch(() => showError("No fue posible cargar las empresas."));

    getMaterials()
      .then(setMaterials)
      .catch(() => showError("No fue posible cargar el catálogo de materiales."));

    // getActiveResponsibles no pide permiso de la pantalla Usuarios,
    // solo trae id y nombre de los usuarios activos
    getActiveResponsibles()
      .then((users) =>
        setEcowayUsers(
          users.map((u) => ({
            id: u.id,
            name: u.name,
            label: `${u.id} — ${u.name}`,
          }))
        )
      )
      .catch(() => showError("No fue posible cargar los usuarios de EcoWay."));
  }, []);

  useEffect(() => {
    if (ticket) {
      setForm({
        ticket_number: ticket.ticket_number ?? "",
        company_id: ticket.company_id ?? "",
        ticket_date: ticket.ticket_date?.slice(0, 10) ?? "",
        client_responsible_name: ticket.client_responsible_name ?? "",
        client_responsible_id: ticket.client_responsible_id ?? "",
        ecoway_responsible_name: ticket.ecoway_responsible_name ?? "",
        ecoway_responsible_id: ticket.ecoway_responsible_id ?? "",
        image_path: ticket.image_path ?? "",
        freight_count: String(ticket.freight_count ?? 1),
      });
      setItems(
        ticket.items?.length
          ? ticket.items.map((i) => {
              // El acta guarda la descripcion del material, no el id, asi
              // que se intenta reencontrarlo en el catalogo actual
              const match = materials.find(
                (m) => m.description_material === i.material_description
              );
              return {
                material_id: match ? String(match.id) : "",
                material_description: i.material_description ?? "",
                quantity_kg: i.quantity_kg ?? "",
                physical_state: i.physical_state ?? "",
                is_locked: !!i.is_locked,
              };
            })
          : [emptyItem()]
      );
    }
  }, [ticket, materials]);

  const hasLockedItems = !readOnly && items.some((i) => i.is_locked);

  const totalKg = items.reduce(
    (sum, i) => sum + (Number(i.quantity_kg) || 0),
    0
  );

  const handleItemChange = (index, field, value) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  // Al elegir un material del catalogo se completan solos la descripcion y el estado fisico
  const handleMaterialSelect = (index, materialId) => {
    const selected = materials.find((m) => String(m.id) === materialId);

    setItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              material_id: materialId,
              material_description: selected?.description_material ?? "",
              physical_state: selected?.physical_state ?? "",
            }
          : item
      )
    );
  };

  const addItem = () => setItems((prev) => [...prev, emptyItem()]);

  const removeItem = (index) => {
    setItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
    // los errores estan alineados por indice con items, hay que quitar el mismo indice
    setItemErrors((prev) => (prev.length ? prev.filter((_, i) => i !== index) : prev));
  };

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { fileName } = await uploadTicketImage(file);
      setForm((prev) => ({ ...prev, image_path: fileName }));
      clearFieldError("image_path");
    } catch (err) {
      let message = "No fue posible subir la imagen.";
      try {
        message = JSON.parse(err.message).message;
      } catch {
        message = err.message || message;
      }
      showError(message);
    } finally {
      setUploading(false);
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!form.ticket_number.trim()) newErrors.ticket_number = "El número de acta es obligatorio.";
    if (!form.company_id) newErrors.company_id = "Debe seleccionar una empresa.";
    if (!form.ticket_date) newErrors.ticket_date = "La fecha es obligatoria.";
    if (!form.client_responsible_name.trim()) newErrors.client_responsible_name = "El responsable del cliente es obligatorio.";
    if (!form.client_responsible_id.trim()) newErrors.client_responsible_id = "La cédula del responsable del cliente es obligatoria.";
    if (!form.ecoway_responsible_id.trim()) newErrors.ecoway_responsible_id = "Debe elegir el responsable de EcoWay.";

    const newItemErrors = items.map((i) => ({
      material_id: !i.material_id ? "Seleccione un material." : "",
      quantity_kg: !(Number(i.quantity_kg) > 0) ? "Ingrese los kilos." : "",
    }));

    setFieldErrors(newErrors);
    setItemErrors(newItemErrors);

    const hasItemError = newItemErrors.some((i) => i.material_id || i.quantity_kg);
    return Object.keys(newErrors).length === 0 && !hasItemError;
  };

  const handleSave = async () => {
    setError("");

    if (!validate()) return;

    // El flete arranca en 0; si se guarda asi se confirma antes que nada,
    // por si se olvido de contarlo (mismo aviso de siempre, como en Cotizaciones)
    if (Number(form.freight_count) === 0) {
      const freightZeroResult = await showConfirm(
        "¿El flete es 0?",
        "No se indicó ningún flete para esta acta. Confirmá que es correcto antes de continuar.",
        { icon: undefined, iconHtml: "🚚" }
      );
      if (!freightZeroResult.isConfirmed) return;
    }

    // Si ya hay otra acta activa de la misma empresa en la misma fecha,
    // se recuerda revisar el flete: puede que ya se haya contado en esa
    // otra acta y esta no deberia sumar uno aparte
    if (!isEdit) {
      try {
        const allTickets = await getTickets();
        const sameDayCompany = allTickets.find(
          (t) => t.status === "Active" && t.company_id === form.company_id && t.ticket_date?.slice(0, 10) === form.ticket_date
        );

        if (sameDayCompany) {
          const freightResult = await showConfirm(
            "¿Esta acta también tiene flete?",
            `Ya existe otra acta activa de esta empresa con la misma fecha (${sameDayCompany.ticket_number}). Revisá la "Cantidad de fletes": si el material se recolectó en el mismo viaje.`,
            { icon: undefined, iconHtml: "🚚" }
          );
          if (!freightResult.isConfirmed) return;
        }
      } catch {
        // si falla la verificacion no bloquea el guardado
      }
    }

    const contactResult = await showConfirm(
      "¿Los datos del responsable por el cliente son correctos?",
      `Nombre: ${form.client_responsible_name} — Cédula: ${form.client_responsible_id}. Revisalos antes de continuar.`
    );
    if (!contactResult.isConfirmed) return;

    const payload = {
      id: ticket?.id,
      ticket_number: form.ticket_number,
      company_id: form.company_id,
      ticket_date: form.ticket_date,
      // validate() ya garantiza que estos campos vienen llenos
      client_responsible_name: form.client_responsible_name,
      client_responsible_id: form.client_responsible_id,
      ecoway_responsible_name: form.ecoway_responsible_name,
      ecoway_responsible_id: form.ecoway_responsible_id,
      image_path: form.image_path,
      freight_count: Number(form.freight_count) || 0,
      items: items.map((i) => ({
        material_description: i.material_description,
        quantity_kg: Number(i.quantity_kg) || 0,
        physical_state: i.physical_state || null,
      })),
    };

    setSaving(true);
    try {
      if (isEdit) {
        await editTicket(payload);
        await showSuccess("Acta actualizada correctamente.");
      } else {
        await createTicket(payload);
        await showSuccess("Acta creada correctamente.");
      }
      // se espera a que termine el aviso antes de cerrar el modal
      onSaved?.();
    } catch (err) {
      let message = "Error al guardar el acta.";
      try {
        message = JSON.parse(err.message).message;
      } catch {
        message = err.message || message;
      }
      setError(message);
      showError(message);
    } finally {
      setSaving(false);
    }
  };

  const inputClass = (extra = "", hasError = false) =>
    `w-full rounded-xl border bg-surface-2 px-4 py-2.5 text-sm text-ink outline-none transition focus:bg-surface disabled:opacity-70 ${
      hasError
        ? "border-danger"
        : "border-edge focus:border-entrada-strong focus:ring-2 focus:ring-entrada/30"
    } ${extra}`;

  const clearFieldError = (field) =>
    setFieldErrors((prev) => (prev[field] ? { ...prev, [field]: "" } : prev));

  const clearItemError = (index, field) =>
    setItemErrors((prev) =>
      prev.length
        ? prev.map((e, i) => (i === index ? { ...e, [field]: "" } : e))
        : prev
    );

  return (
    <>
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-brand-900/55 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-2xl border border-edge bg-surface shadow-2xl">
        {/* HEADER */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-edge bg-surface px-6 py-5">
          <div>
            <span className="eyebrow text-entrada-strong">Actas de Entrada</span>
            <h2 className="text-xl font-semibold text-ink -mt-0.5">
              {readOnly
                ? `Acta ${ticket?.ticket_number}`
                : isEdit
                ? "Editar acta"
                : "Nueva acta de entrada"}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink-dim transition hover:bg-surface-2 hover:text-ink"
            aria-label="Cerrar"
            title="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {readOnly && ticket?.status === "Voided" && (
            <div className="rounded-lg border border-danger/20 bg-danger-soft px-4 py-3">
              <p className="text-sm font-medium text-danger">Acta anulada</p>
              <p className="text-sm text-danger/90 mt-0.5">{ticket.void_reason}</p>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-danger/20 bg-danger-soft px-4 py-3">
              <p className="text-sm text-danger">{error}</p>
            </div>
          )}

          {/* DATOS GENERALES */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="ticket-number" className="mb-2 block text-sm font-medium text-ink-dim">
                No. de acta {!readOnly && <span className="text-danger">*</span>}
              </label>
              <input
                id="ticket-number"
                type="text"
                inputMode="numeric"
                disabled={readOnly}
                value={form.ticket_number}
                onChange={(e) => {
                  setForm({ ...form, ticket_number: e.target.value.replace(/[^0-9]/g, "") });
                  clearFieldError("ticket_number");
                }}
                className={inputClass("font-data", !!fieldErrors.ticket_number)}
                placeholder="12297"
              />
              {fieldErrors.ticket_number && (
                <p className="mt-1 text-sm text-danger">{fieldErrors.ticket_number}</p>
              )}
            </div>

            <div>
              <label htmlFor="ticket-date" className="mb-2 block text-sm font-medium text-ink-dim">
                Fecha {!readOnly && <span className="text-danger">*</span>}
              </label>
              <input
                id="ticket-date"
                type="date"
                disabled={readOnly}
                value={form.ticket_date}
                onChange={(e) => {
                  setForm({ ...form, ticket_date: e.target.value });
                  clearFieldError("ticket_date");
                }}
                className={inputClass("", !!fieldErrors.ticket_date)}
              />
              {fieldErrors.ticket_date && (
                <p className="mt-1 text-sm text-danger">{fieldErrors.ticket_date}</p>
              )}
            </div>

            <div>
              <label htmlFor="ticket-freight-count" className="mb-2 block text-sm font-medium text-ink-dim">
                Cantidad de fletes
              </label>
              <input
                id="ticket-freight-count"
                type="text"
                inputMode="numeric"
                disabled={readOnly}
                value={form.freight_count}
                onChange={(e) =>
                  setForm({ ...form, freight_count: e.target.value.replace(/[^0-9]/g, "") })
                }
                className={inputClass("font-data")}
                placeholder="0"
              />
            </div>

            <div className="md:col-span-2">
              {readOnly ? (
                <div>
                  <label className="mb-2 block text-sm font-medium text-ink-dim">Empresa generadora</label>
                  <input disabled value={ticket?.company_name ?? ""} className={inputClass()} />
                </div>
              ) : (
                <SearchSelect
                  label="Empresa generadora *"
                  accent="entrada"
                  options={companies}
                  value={form.company_id}
                  valueField="id"
                  labelField="label"
                  error={fieldErrors.company_id}
                  onChange={(value) => {
                    // Nombre y cedula del responsable se toman del
                    // contacto de la empresa seleccionada, ya no se editan
                    const selectedCompany = companies.find((c) => c.id === value);
                    setForm({
                      ...form,
                      company_id: value,
                      client_responsible_name: selectedCompany?.contact_name ?? "",
                      client_responsible_id: selectedCompany?.contact_id ?? "",
                    });
                    setFieldErrors((prev) => ({
                      ...prev,
                      company_id: "",
                      client_responsible_name: "",
                      client_responsible_id: "",
                    }));
                  }}
                />
              )}
            </div>

            {/* Nombre y cedula del responsable por cliente se completan con
                el contacto de la empresa seleccionada, pero se pueden
                cambiar a mano por si quien firma no es el contacto default */}
            <div>
              <label htmlFor="client-name" className="mb-2 block text-sm font-medium text-ink-dim">
                Responsable por cliente {!readOnly && <span className="text-danger">*</span>}
              </label>
              <input
                id="client-name"
                type="text"
                disabled={readOnly}
                value={form.client_responsible_name}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, client_responsible_name: e.target.value }));
                  clearFieldError("client_responsible_name");
                }}
                className={inputClass("", !!fieldErrors.client_responsible_name)}
                placeholder="Se completa según la empresa"
              />
              {fieldErrors.client_responsible_name && (
                <p className="mt-1 text-sm text-danger">{fieldErrors.client_responsible_name}</p>
              )}
            </div>

            <div>
              <label htmlFor="client-id" className="mb-2 block text-sm font-medium text-ink-dim">
                Cédula responsable cliente {!readOnly && <span className="text-danger">*</span>}
              </label>
              <input
                id="client-id"
                type="text"
                disabled={readOnly}
                value={form.client_responsible_id}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, client_responsible_id: e.target.value }));
                  clearFieldError("client_responsible_id");
                }}
                className={inputClass("font-data", !!fieldErrors.client_responsible_id)}
                placeholder="Se completa según la empresa"
              />
              {fieldErrors.client_responsible_id && (
                <p className="mt-1 text-sm text-danger">{fieldErrors.client_responsible_id}</p>
              )}
            </div>

            {readOnly ? (
              <>
                <div>
                  <label className="mb-2 block text-sm font-medium text-ink-dim">Responsable por EcoWay</label>
                  <input disabled value={form.ecoway_responsible_name} className={inputClass()} />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-ink-dim">Cédula responsable EcoWay</label>
                  <input disabled value={form.ecoway_responsible_id} className={inputClass("font-data")} />
                </div>
              </>
            ) : (
              <>
                <div>
                  <SearchSelect
                    label="Cédula responsable EcoWay *"
                    accent="entrada"
                    placeholder="Buscar por cédula o nombre..."
                    options={ecowayUsers}
                    value={form.ecoway_responsible_id}
                    valueField="id"
                    labelField="label"
                    displayField="id"
                    error={fieldErrors.ecoway_responsible_id}
                    onChange={(id) => {
                      const match = ecowayUsers.find((u) => u.id === id);
                      setForm((prev) => ({
                        ...prev,
                        ecoway_responsible_id: id,
                        ecoway_responsible_name: match?.name ?? "",
                      }));
                      clearFieldError("ecoway_responsible_id");
                    }}
                  />
                </div>

                <div>
                  <label htmlFor="ecoway-name" className="mb-2 block text-sm font-medium text-ink-dim">
                    Responsable por EcoWay
                  </label>
                  <input
                    id="ecoway-name"
                    type="text"
                    disabled
                    value={form.ecoway_responsible_name}
                    className={inputClass()}
                    placeholder="Se completa al elegir la cédula"
                  />
                </div>
              </>
            )}
          </div>

          {/* FOTO DEL ACTA */}
          <div>
            <label className="mb-2 block text-sm font-medium text-ink-dim">
              Foto del acta física <span className="text-ink-dim/70">(opcional)</span>
            </label>

            <div className="flex items-start gap-4">
              {form.image_path ? (
                <button
                  type="button"
                  onClick={() => setShowImageLightbox(true)}
                  className="group relative h-32 w-32 overflow-hidden rounded-xl border border-edge"
                  aria-label="Ver foto del acta en grande"
                  title="Ver en grande"
                >
                  <img
                    src={ticketImageUrl(form.image_path)}
                    alt="Foto del acta"
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-transparent transition group-hover:bg-black/40 group-hover:text-white">
                    <Maximize2 size={22} />
                  </span>
                </button>
              ) : (
                <div
                  className={`flex h-32 w-32 items-center justify-center rounded-xl border border-dashed text-ink-dim ${
                    fieldErrors.image_path ? "border-danger" : "border-edge"
                  }`}
                >
                  <ImageIcon size={28} />
                </div>
              )}

              {!readOnly && (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleImageSelect}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex items-center gap-2 rounded-xl border border-edge bg-surface px-4 py-2 text-sm font-medium text-ink transition hover:bg-surface-2 disabled:opacity-60"
                  >
                    <Upload size={16} />
                    {uploading ? "Subiendo..." : form.image_path ? "Cambiar foto" : "Subir foto"}
                  </button>
                  <p className="mt-2 text-xs text-ink-dim">
                    JPG, PNG o WEBP, hasta 8 MB. Es la evidencia visual del acta física.
                  </p>
                  {fieldErrors.image_path && (
                    <p className="mt-1 text-sm text-danger">{fieldErrors.image_path}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* MATERIALES */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-ink-dim">Materiales recolectados</label>

              {!readOnly && (
                <button
                  type="button"
                  onClick={addItem}
                  className="flex items-center gap-1.5 text-sm font-medium text-entrada-strong hover:underline"
                >
                  <Plus size={16} />
                  Agregar línea
                </button>
              )}
            </div>

            {hasLockedItems && (
              <p className="mb-2 text-xs text-ink-dim">
                Las líneas ya reservadas en una acta de salida quedan bloqueadas: el material y los kilos no se pueden cambiar. Si hace falta corregirlas, anulá la acta de salida correspondiente primero.
              </p>
            )}

            <div className="overflow-x-auto rounded-xl border border-edge">
              <table className="w-full text-sm">
                <thead className="bg-entrada-soft">
                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-entrada-strong">
                    <th className="p-3">Material recolectado {!readOnly && <span className="text-danger">*</span>}</th>
                    <th className="p-3">Estado físico</th>
                    <th className="p-3">Kilos {!readOnly && <span className="text-danger">*</span>}</th>
                    {!readOnly && <th className="p-3 w-10" />}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => {
                    const locked = !readOnly && item.is_locked;
                    return (
                    <tr key={index} className="border-t border-edge">
                      <td className="p-2">
                        {readOnly ? (
                          <span className="block px-2 py-2 text-ink">{item.material_description || "—"}</span>
                        ) : locked ? (
                          <span
                            className="block px-2 py-2 text-ink-dim"
                            title="Ya se reservó en una acta de salida, no se puede cambiar"
                          >
                            {item.material_description || "—"}
                          </span>
                        ) : (
                          <>
                            <select
                              value={item.material_id}
                              onChange={(e) => {
                                handleMaterialSelect(index, e.target.value);
                                clearItemError(index, "material_id");
                              }}
                              className={inputClass("py-2", !!itemErrors[index]?.material_id)}
                            >
                              <option value="">Seleccione un material</option>
                              {materials.map((m) => (
                                <option key={m.id} value={m.id}>
                                  {m.description_material}
                                </option>
                              ))}
                            </select>
                            {itemErrors[index]?.material_id && (
                              <p className="mt-1 text-sm text-danger">{itemErrors[index].material_id}</p>
                            )}
                          </>
                        )}
                      </td>
                      <td className="p-2">
                        {/* Se completa solo al elegir el material: viene de su
                            ficha en el catálogo, no se escribe a mano. */}
                        <span className="block px-2 py-2 text-ink-dim">
                          {item.physical_state || "—"}
                        </span>
                      </td>
                      <td className="p-2">
                        <input
                          disabled={readOnly || locked}
                          inputMode="decimal"
                          value={item.quantity_kg}
                          title={locked ? "Ya se reservó en una acta de salida, no se puede cambiar" : undefined}
                          onChange={(e) => {
                            handleItemChange(index, "quantity_kg", sanitizeDecimal(e.target.value));
                            clearItemError(index, "quantity_kg");
                          }}
                          className={inputClass("py-2 font-data", !!itemErrors[index]?.quantity_kg)}
                        />
                        {itemErrors[index]?.quantity_kg && (
                          <p className="mt-1 text-sm text-danger">{itemErrors[index].quantity_kg}</p>
                        )}
                      </td>
                      {!readOnly && (
                        <td className="p-2 text-center">
                          {!locked && (
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              aria-label="Quitar línea"
                              title="Quitar línea"
                              className="rounded-lg p-1.5 text-ink-dim transition hover:bg-danger-soft hover:text-danger"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-2 flex justify-end">
              <span className="font-data text-sm font-semibold text-ink">
                Total: {totalKg.toLocaleString("es-CR")} kg
              </span>
            </div>
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
              disabled={saving || uploading}
              className="rounded-xl bg-entrada px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-entrada-strong disabled:opacity-60"
            >
              {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear acta"}
            </button>
          )}
        </div>
      </div>
    </div>

    {showImageLightbox && form.image_path && (
      <ImageLightbox
        src={ticketImageUrl(form.image_path)}
        alt="Foto del acta"
        fileName={`Acta-${ticket?.ticket_number || "entrada"}${form.image_path.slice(form.image_path.lastIndexOf("."))}`}
        onClose={() => setShowImageLightbox(false)}
      />
    )}
    </>
  );
}
