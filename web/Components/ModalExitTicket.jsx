"use client";

import { useEffect, useRef, useState } from "react";
import { X, Plus, Trash2, Upload, ImageIcon, Maximize2 } from "lucide-react";
import SearchSelect from "./SearchSelect";
import ImageLightbox from "./ImageLightbox";
import {
  createExitTicket,
  editExitTicket,
  uploadExitTicketImage,
  exitTicketImageUrl,
  getExitTicket,
} from "../services/ExitTicketsService";
import { getCompanies, getAvailableInventory } from "../services/TicketsService";
import { getActiveResponsibles } from "../services/userServiceAPI";
import { showSuccess, showError, showConfirm } from "../utils/alerts";
import { formatDateOnly } from "../utils/dateOnly";

const emptyItem = () => ({
  material_description: "",
  quantity_kg: "",
  physical_state: "",
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

export default function ModalExitTicket({ exitTicket, readOnly, onClose, onSaved }) {
  const isEdit = !!exitTicket && !readOnly;
  // Se puede editar el material y los kilos de cada linea. El backend es
  // quien decide si el cambio es valido: subir una linea (o agregar una
  // nueva) reserva por FIFO lo que haga falta y falla si no hay
  // suficiente disponible; bajarla libera el sobrante de vuelta al
  // inventario de entrada. Una linea ya marcada como gestionada queda
  // inmutable (el destino ya confirmo que la recibio con esos kilos)
  const itemsLocked = readOnly;
  const fileInputRef = useRef(null);

  const [companies, setCompanies] = useState([]);
  // cuanto queda disponible de cada material en el inventario de entrada,
  // es de donde se puede elegir al armar el acta de salida (trae tambien
  // el estado fisico, tomado de la boleta de entrada, no del catalogo)
  const [availableInventory, setAvailableInventory] = useState([]);
  const [ecowayUsers, setEcowayUsers] = useState([]);
  const [form, setForm] = useState({
    exit_ticket_number: "",
    destination_company_id: "",
    // vacia, que la elija quien registra el acta
    exit_date: "",
    receiver_responsible_name: "",
    receiver_responsible_id: "",
    ecoway_responsible_name: "",
    ecoway_responsible_id: "",
    image_path: "",
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
          // Mismo catalogo de empresas que las actas de recoleccion, aca
          // representa a quien recibe el material. Solo activas, salvo la
          // que ya tenia el acta si esta en edicion
          data
            .filter((c) => c.is_active || c.id === exitTicket?.destination_company_id)
            .map((c) => ({
              ...c,
              label: c.project ? `${c.nombre_comercial} — ${c.project}` : c.nombre_comercial,
            }))
        )
      )
      .catch(() => showError("No fue posible cargar las empresas."));

    getAvailableInventory()
      .then(setAvailableInventory)
      .catch(() => showError("No fue posible cargar el inventario de entrada disponible."));

    // no usa getUsuarios() porque ese pide permiso de la pantalla
    // Usuarios; este solo trae id y nombre de los activos
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
    if (exitTicket) {
      setForm({
        exit_ticket_number: exitTicket.exit_ticket_number ?? "",
        destination_company_id: exitTicket.destination_company_id ?? "",
        exit_date: exitTicket.exit_date?.slice(0, 10) ?? "",
        receiver_responsible_name: exitTicket.receiver_responsible_name ?? "",
        receiver_responsible_id: exitTicket.receiver_responsible_id ?? "",
        ecoway_responsible_name: exitTicket.ecoway_responsible_name ?? "",
        ecoway_responsible_id: exitTicket.ecoway_responsible_id ?? "",
        image_path: exitTicket.image_path ?? "",
      });
      setItems(
        exitTicket.items?.length
          ? exitTicket.items.map((i) => ({
              material_description: i.material_description ?? "",
              quantity_kg: i.quantity_kg ?? "",
              physical_state: i.physical_state ?? "",
              // Una vez gestionada, esta linea puntual queda inmutable
              // (el destino ya confirmo que la recibio con esos kilos)
              management_date: i.management_date ?? null,
            }))
          : [emptyItem()]
      );
    }
  }, [exitTicket]);

  // De cuales actas de entrada salio el material de cada linea. El listado
  // (de donde viene la prop exitTicket) no trae este detalle, asi que se
  // pide aparte el acta completa. Se guarda por descripcion de material,
  // igual que originalQuantityByMaterial mas abajo
  const [sourcesByMaterial, setSourcesByMaterial] = useState({});

  useEffect(() => {
    if (!exitTicket?.id) {
      setSourcesByMaterial({});
      return;
    }

    getExitTicket(exitTicket.id)
      .then((full) => {
        const map = {};
        (full.items || []).forEach((i) => {
          if (i.sources?.length) map[i.material_description] = i.sources;
        });
        setSourcesByMaterial(map);
      })
      .catch(() => {
        // si falla, la pantalla sigue funcionando sin este detalle
      });
  }, [exitTicket?.id]);

  const totalKg = items.reduce(
    (sum, i) => sum + (Number(i.quantity_kg) || 0),
    0
  );

  // Al editar, lo que esta acta ya tenia reservado de cada material se
  // libera y se vuelve a reservar al guardar, asi que tambien cuenta como
  // disponible (si no, el disponible se veria de menos mientras se edita)
  const originalQuantityByMaterial = {};
  if (isEdit) {
    (exitTicket?.items || []).forEach((i) => {
      originalQuantityByMaterial[i.material_description] =
        (originalQuantityByMaterial[i.material_description] || 0) + (Number(i.quantity_kg) || 0);
    });
  }

  const availableForMaterial = (materialDescription) => {
    const pooled = availableInventory.find((m) => m.material_description === materialDescription)?.available_kg ?? 0;
    return pooled + (originalQuantityByMaterial[materialDescription] || 0);
  };

  // El disponible ya calculado, mas cualquier material que una linea ya
  // tenga elegido pero que no aparezca en el disponible (se agoto en otro
  // lado), para no dejar el select en blanco
  const materialOptions = (() => {
    const map = new Map();
    availableInventory.forEach((m) =>
      map.set(m.material_description, { available_kg: availableForMaterial(m.material_description), physical_state: m.physical_state })
    );
    items.forEach((it) => {
      if (it.material_description && !map.has(it.material_description)) {
        map.set(it.material_description, {
          available_kg: availableForMaterial(it.material_description),
          physical_state: it.physical_state || null,
        });
      }
    });
    return Array.from(map.entries()).map(([material_description, info]) => ({ material_description, ...info }));
  })();

  const handleItemChange = (index, field, value) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  // Al elegir un material se completa solo el estado fisico, tomado de la
  // boleta de entrada mas vieja con disponible (no del catalogo de
  // materiales, que puede no tener una ficha exacta para lo recolectado)
  const handleMaterialSelect = (index, materialDescription) => {
    const selected = availableInventory.find((m) => m.material_description === materialDescription);

    setItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              material_description: materialDescription,
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
      const { fileName } = await uploadExitTicketImage(file);
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

    if (!form.exit_ticket_number.trim()) newErrors.exit_ticket_number = "El número de acta es obligatorio.";
    if (!form.destination_company_id) newErrors.destination_company_id = "Debe seleccionar una empresa de destino.";
    if (!form.exit_date) newErrors.exit_date = "La fecha es obligatoria.";
    if (!form.receiver_responsible_name.trim()) newErrors.receiver_responsible_name = "El responsable por el receptor es obligatorio.";
    if (!form.receiver_responsible_id.trim()) newErrors.receiver_responsible_id = "La cédula del responsable por el receptor es obligatoria.";
    if (!form.ecoway_responsible_id.trim()) newErrors.ecoway_responsible_id = "Debe elegir el responsable de EcoWay.";

    // El maximo por linea es una ayuda del lado del cliente nada mas; si
    // dos lineas usan el mismo material esta cuenta no las combina entre
    // si (el backend es quien decide de verdad al guardar)
    const newItemErrors = items.map((i) => {
      const material_description = !i.material_description ? "Seleccione un material." : "";
      let quantity_kg = !(Number(i.quantity_kg) > 0) ? "Ingrese los kilos." : "";

      if (!quantity_kg && i.material_description) {
        const max = availableForMaterial(i.material_description);
        if (Number(i.quantity_kg) > max) {
          quantity_kg = `Máximo disponible: ${max.toLocaleString("es-CR")} kg.`;
        }
      }

      return { material_description, quantity_kg };
    });

    setFieldErrors(newErrors);
    setItemErrors(newItemErrors);

    const hasItemError = newItemErrors.some((i) => i.material_description || i.quantity_kg);
    return Object.keys(newErrors).length === 0 && !hasItemError;
  };

  const handleSave = async () => {
    setError("");

    if (!validate()) return;

    const contactResult = await showConfirm(
      "¿Los datos del responsable por el receptor son correctos?",
      `Nombre: ${form.receiver_responsible_name} — Cédula: ${form.receiver_responsible_id}. Revisalos antes de continuar.`
    );
    if (!contactResult.isConfirmed) return;

    const payload = {
      id: exitTicket?.id,
      exit_ticket_number: form.exit_ticket_number,
      destination_company_id: form.destination_company_id,
      exit_date: form.exit_date,
      // validate() ya garantiza que estos campos vienen llenos
      receiver_responsible_name: form.receiver_responsible_name,
      receiver_responsible_id: form.receiver_responsible_id,
      ecoway_responsible_name: form.ecoway_responsible_name,
      ecoway_responsible_id: form.ecoway_responsible_id,
      image_path: form.image_path,
      items: items.map((i) => ({
        material_description: i.material_description,
        quantity_kg: Number(i.quantity_kg) || 0,
        physical_state: i.physical_state || null,
      })),
    };

    setSaving(true);
    try {
      if (isEdit) {
        await editExitTicket(payload);
        await showSuccess("Acta de salida actualizada correctamente.");
      } else {
        await createExitTicket(payload);
        await showSuccess("Acta de salida creada correctamente.");
      }
      // se espera a que termine el aviso antes de cerrar el modal
      onSaved?.();
    } catch (err) {
      let message = "Error al guardar el acta de salida.";
      try {
        message = JSON.parse(err.message).message;
      } catch {
        message = err.message || message;
      }
      setError(message);
      showError(message);

      // Si fallo por falta de inventario, refresca el disponible: puede
      // que otra acta se haya llevado material mientras se llenaba esta
      getAvailableInventory().then(setAvailableInventory).catch(() => {});
    } finally {
      setSaving(false);
    }
  };

  const inputClass = (extra = "", hasError = false) =>
    `w-full rounded-xl border bg-surface-2 px-4 py-2.5 text-sm text-ink outline-none transition focus:bg-surface disabled:opacity-70 ${
      hasError
        ? "border-danger"
        : "border-edge focus:border-salida-strong focus:ring-2 focus:ring-salida/30"
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
            <span className="eyebrow text-salida-strong">Actas de Salida</span>
            <h2 className="text-xl font-semibold text-ink -mt-0.5">
              {readOnly
                ? `Acta de salida ${exitTicket?.exit_ticket_number}`
                : isEdit
                ? "Editar acta de salida"
                : "Nueva acta de salida"}
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
          {readOnly && exitTicket?.status === "Voided" && (
            <div className="rounded-lg border border-danger/20 bg-danger-soft px-4 py-3">
              <p className="text-sm font-medium text-danger">Acta anulada</p>
              <p className="text-sm text-danger/90 mt-0.5">{exitTicket.void_reason}</p>
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
              <label htmlFor="exit-ticket-number" className="mb-2 block text-sm font-medium text-ink-dim">
                No. de acta {!readOnly && <span className="text-danger">*</span>}
              </label>
              <input
                id="exit-ticket-number"
                type="text"
                inputMode="numeric"
                disabled={readOnly}
                value={form.exit_ticket_number}
                onChange={(e) => {
                  setForm({ ...form, exit_ticket_number: e.target.value.replace(/[^0-9]/g, "") });
                  clearFieldError("exit_ticket_number");
                }}
                className={inputClass("font-data", !!fieldErrors.exit_ticket_number)}
                placeholder="03429"
              />
              {fieldErrors.exit_ticket_number && (
                <p className="mt-1 text-sm text-danger">{fieldErrors.exit_ticket_number}</p>
              )}
            </div>

            <div>
              <label htmlFor="exit-date" className="mb-2 block text-sm font-medium text-ink-dim">
                Fecha {!readOnly && <span className="text-danger">*</span>}
              </label>
              <input
                id="exit-date"
                type="date"
                disabled={readOnly}
                value={form.exit_date}
                onChange={(e) => {
                  setForm({ ...form, exit_date: e.target.value });
                  clearFieldError("exit_date");
                }}
                className={inputClass("", !!fieldErrors.exit_date)}
              />
              {fieldErrors.exit_date && (
                <p className="mt-1 text-sm text-danger">{fieldErrors.exit_date}</p>
              )}
            </div>

            <div className="md:col-span-2">
              {readOnly ? (
                <div>
                  <label className="mb-2 block text-sm font-medium text-ink-dim">Empresa de destino</label>
                  <input disabled value={exitTicket?.destination_company_name ?? ""} className={inputClass()} />
                </div>
              ) : (
                <SearchSelect
                  label="Empresa de destino *"
                  accent="salida"
                  options={companies}
                  value={form.destination_company_id}
                  valueField="id"
                  labelField="label"
                  error={fieldErrors.destination_company_id}
                  onChange={(value) => {
                    // Nombre y cedula del responsable por el receptor se
                    // toman del contacto de la empresa, ya no se editan
                    const selectedCompany = companies.find((c) => c.id === value);
                    setForm({
                      ...form,
                      destination_company_id: value,
                      receiver_responsible_name: selectedCompany?.contact_name ?? "",
                      receiver_responsible_id: selectedCompany?.contact_id ?? "",
                    });
                    setFieldErrors((prev) => ({
                      ...prev,
                      destination_company_id: "",
                      receiver_responsible_name: "",
                      receiver_responsible_id: "",
                    }));
                  }}
                />
              )}
            </div>

            {/* Nombre y cedula del responsable por receptor se completan con
                el contacto de la empresa de destino, pero se pueden cambiar
                a mano por si quien firma no es el contacto default */}
            <div>
              <label htmlFor="receiver-name" className="mb-2 block text-sm font-medium text-ink-dim">
                Responsable por receptor {!readOnly && <span className="text-danger">*</span>}
              </label>
              <input
                id="receiver-name"
                type="text"
                disabled={readOnly}
                value={form.receiver_responsible_name}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, receiver_responsible_name: e.target.value }));
                  clearFieldError("receiver_responsible_name");
                }}
                className={inputClass("", !!fieldErrors.receiver_responsible_name)}
                placeholder="Se completa según la empresa"
              />
              {fieldErrors.receiver_responsible_name && (
                <p className="mt-1 text-sm text-danger">{fieldErrors.receiver_responsible_name}</p>
              )}
            </div>

            <div>
              <label htmlFor="receiver-id" className="mb-2 block text-sm font-medium text-ink-dim">
                Cédula responsable receptor {!readOnly && <span className="text-danger">*</span>}
              </label>
              <input
                id="receiver-id"
                type="text"
                disabled={readOnly}
                value={form.receiver_responsible_id}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, receiver_responsible_id: e.target.value }));
                  clearFieldError("receiver_responsible_id");
                }}
                className={inputClass("font-data", !!fieldErrors.receiver_responsible_id)}
                placeholder="Se completa según la empresa"
              />
              {fieldErrors.receiver_responsible_id && (
                <p className="mt-1 text-sm text-danger">{fieldErrors.receiver_responsible_id}</p>
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
                    accent="salida"
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
                    src={exitTicketImageUrl(form.image_path)}
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
              <label className="block text-sm font-medium text-ink-dim">Materiales entregados</label>

              {!itemsLocked && (
                <button
                  type="button"
                  onClick={addItem}
                  className="flex items-center gap-1.5 text-sm font-medium text-salida-strong hover:underline"
                >
                  <Plus size={16} />
                  Agregar línea
                </button>
              )}
            </div>

            {isEdit && (
              <p className="mb-2 text-xs text-ink-dim">
                Subir los kilos de una línea reserva lo que haga falta del inventario de entrada (falla si no hay suficiente); bajarlos libera el
                sobrante de vuelta. Una línea ya marcada como gestionada no se puede tocar.
              </p>
            )}

            <div className="overflow-x-auto rounded-xl border border-edge">
              <table className="w-full text-sm">
                <thead className="bg-salida-soft">
                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-salida-strong">
                    <th className="p-3">
                      Material entregado {!itemsLocked && <span className="text-danger">*</span>}
                      {!itemsLocked && (
                        <span className="ml-1 font-normal normal-case text-ink-dim">
                          (solo lo disponible en el inventario de entrada)
                        </span>
                      )}
                    </th>
                    <th className="p-3">Estado físico</th>
                    <th className="p-3">Kilos {!itemsLocked && <span className="text-danger">*</span>}</th>
                    {!itemsLocked && <th className="p-3 w-10" />}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => {
                    // Una linea ya gestionada queda inmutable aunque el
                    // resto del acta se pueda seguir editando
                    const lineLocked = itemsLocked || !!item.management_date;
                    const sources = sourcesByMaterial[item.material_description];

                    return (
                    <tr key={index} className="border-t border-edge">
                      <td className="p-2">
                        {lineLocked ? (
                          <span className="block px-2 py-2 text-ink">{item.material_description || "—"}</span>
                        ) : (
                          <>
                            <select
                              value={item.material_description}
                              onChange={(e) => {
                                handleMaterialSelect(index, e.target.value);
                                clearItemError(index, "material_description");
                              }}
                              className={inputClass("py-2", !!itemErrors[index]?.material_description)}
                            >
                              <option value="">Seleccione un material</option>
                              {materialOptions.map((m) => (
                                <option key={m.material_description} value={m.material_description}>
                                  {m.material_description} ({m.available_kg.toLocaleString("es-CR")} kg disponibles)
                                </option>
                              ))}
                            </select>
                            {itemErrors[index]?.material_description && (
                              <p className="mt-1 text-sm text-danger">{itemErrors[index].material_description}</p>
                            )}
                          </>
                        )}
                        {item.management_date && !readOnly && (
                          <p className="px-2 pb-1.5 text-xs text-ink-dim">
                            Gestionada el {formatDateOnly(item.management_date)} — no se puede modificar
                          </p>
                        )}
                        {sources?.length > 0 && (
                          <p className="px-2 pb-1.5 text-xs text-ink-dim">
                            De: {sources
                              .map(
                                (s) =>
                                  `Acta ${s.ticket_number} (${s.company_name}, ${formatDateOnly(s.ticket_date)}) — ${Number(s.quantity_kg).toLocaleString("es-CR")} kg`
                              )
                              .join("; ")}
                          </p>
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
                          disabled={lineLocked}
                          inputMode="decimal"
                          value={item.quantity_kg}
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
                      {!itemsLocked && (
                        <td className="p-2 text-center">
                          {!lineLocked && (
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
              className="rounded-xl bg-salida px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-salida-strong disabled:opacity-60"
            >
              {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear acta"}
            </button>
          )}
        </div>
      </div>
    </div>

    {showImageLightbox && form.image_path && (
      <ImageLightbox
        src={exitTicketImageUrl(form.image_path)}
        alt="Foto del acta"
        fileName={`Acta-salida-${exitTicket?.exit_ticket_number || ""}${form.image_path.slice(form.image_path.lastIndexOf("."))}`}
        onClose={() => setShowImageLightbox(false)}
      />
    )}
    </>
  );
}
