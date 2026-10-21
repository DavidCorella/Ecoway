"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { createCompany, editCompany } from "../services/TicketsService";
import { showSuccess, showError, showConfirm } from "../utils/alerts";

const emptyForm = () => ({
  nombre_comercial: "",
  razon_social: "",
  cedula_juridica: "",
  address: "",
  contact_name: "",
  contact_id: "",
  contact_position: "",
  contact_phone: "",
  contact_cell: "",
  email: "",
  project: "",
});

export default function ModalCompany({ company, onClose, onSaved }) {
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (company) {
      setForm({
        nombre_comercial: company.nombre_comercial ?? "",
        razon_social: company.razon_social ?? "",
        cedula_juridica: company.cedula_juridica ?? "",
        address: company.address ?? "",
        contact_name: company.contact_name ?? "",
        contact_id: company.contact_id ?? "",
        contact_position: company.contact_position ?? "",
        contact_phone: company.contact_phone ?? "",
        contact_cell: company.contact_cell ?? "",
        email: company.email ?? "",
        project: company.project ?? "",
      });
    } else {
      setForm(emptyForm());
    }
    setError("");
    setFieldErrors({});
  }, [company]);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  // Va agregando los guiones solo, con el formato X-XXX-XXXXXX
  // (ej: escribir "3101494504" queda "3-101-494504")
  const handleCedulaJuridicaChange = (e) => {
    const digits = e.target.value.replace(/[^0-9]/g, "").slice(0, 10);
    let formatted = digits;
    if (digits.length > 1) formatted = `${digits.slice(0, 1)}-${digits.slice(1)}`;
    if (digits.length > 4) formatted = `${digits.slice(0, 1)}-${digits.slice(1, 4)}-${digits.slice(4)}`;

    setForm((prev) => ({ ...prev, cedula_juridica: formatted }));
    setFieldErrors((prev) => ({ ...prev, cedula_juridica: undefined }));
  };

  // Deja pasar solo digitos, sin guiones ni espacios
  const handlePhoneChange = (field) => (e) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const errors = {};
    // project queda afuera, es el unico campo opcional
    if (!form.nombre_comercial.trim()) errors.nombre_comercial = "El nombre comercial es obligatorio.";
    if (!form.razon_social.trim()) errors.razon_social = "La razón social es obligatoria.";
    if (!form.cedula_juridica.trim()) errors.cedula_juridica = "La cédula jurídica es obligatoria.";
    else if (!/^\d-\d{3}-\d{6}$/.test(form.cedula_juridica)) errors.cedula_juridica = "La cédula jurídica debe tener el formato X-XXX-XXXXXX (ej: 3-101-123456).";
    if (!form.address.trim()) errors.address = "La dirección es obligatoria.";
    if (!form.contact_name.trim()) errors.contact_name = "El nombre de contacto es obligatorio.";
    if (!form.contact_id.trim()) errors.contact_id = "La cédula de contacto es obligatoria.";
    if (!form.contact_position.trim()) errors.contact_position = "El cargo de contacto es obligatorio.";
    if (!form.contact_phone.trim()) errors.contact_phone = "El teléfono es obligatorio.";
    else if (!/^[0-9]+$/.test(form.contact_phone)) errors.contact_phone = "El teléfono solo puede contener números.";
    if (!form.contact_cell.trim()) errors.contact_cell = "El celular es obligatorio.";
    else if (!/^[0-9]+$/.test(form.contact_cell)) errors.contact_cell = "El celular solo puede contener números.";
    if (!form.email.trim()) errors.email = "El correo es obligatorio.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = "El correo no tiene un formato válido.";

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    setError("");
    if (!validate()) return;

    const contactResult = await showConfirm(
      "¿Los datos de contacto son correctos?",
      `${form.contact_name} (${form.contact_id}) — ${form.contact_position}. Tel: ${form.contact_phone} / Cel: ${form.contact_cell} / ${form.email}. Revisalos antes de continuar.`
    );
    if (!contactResult.isConfirmed) return;

    setSaving(true);
    try {
      const payload = {
        ...form,
        project: form.project.trim() || undefined,
      };

      if (company) {
        await editCompany({ id: company.id, ...payload });
        showSuccess("Empresa actualizada correctamente.");
      } else {
        await createCompany(payload);
        showSuccess("Empresa creada correctamente.");
      }

      onSaved?.();
    } catch (err) {
      let message = "No fue posible guardar la empresa.";
      try {
        message = JSON.parse(err.message).message;
      } catch {
        message = err.message || message;
      }
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const inputClass = (field) =>
    `w-full rounded-xl border bg-surface-2 px-4 py-2.5 text-sm text-ink outline-none transition ${
      fieldErrors[field]
        ? "border-danger"
        : "border-edge focus:border-accent-strong focus:ring-2 focus:ring-accent/30"
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-900/55 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-edge bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-edge px-6 py-5">
          <div>
            <span className="eyebrow text-accent-strong">Empresas</span>
            <h2 className="text-xl font-semibold text-ink -mt-0.5">
              {company ? "Editar empresa" : "Nueva empresa"}
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

        <div className="p-6 space-y-5">
          {error && (
            <div className="rounded-lg border border-danger/20 bg-danger-soft px-4 py-3 text-sm text-danger">
              {error}
            </div>
          )}

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-dim">
              Datos de la empresa
            </p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-ink-dim" htmlFor="company-comercial">
                  Nombre comercial *
                </label>
                <input
                  id="company-comercial"
                  value={form.nombre_comercial}
                  onChange={handleChange("nombre_comercial")}
                  className={inputClass("nombre_comercial")}
                />
                {fieldErrors.nombre_comercial && <p className="mt-1 text-sm text-danger">{fieldErrors.nombre_comercial}</p>}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-ink-dim" htmlFor="company-razon">
                  Razón social *
                </label>
                <input
                  id="company-razon"
                  value={form.razon_social}
                  onChange={handleChange("razon_social")}
                  className={inputClass("razon_social")}
                />
                {fieldErrors.razon_social && <p className="mt-1 text-sm text-danger">{fieldErrors.razon_social}</p>}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-ink-dim" htmlFor="company-cedula">
                  Cédula jurídica *
                </label>
                <input
                  id="company-cedula"
                  value={form.cedula_juridica}
                  onChange={handleCedulaJuridicaChange}
                  className={`${inputClass("cedula_juridica")} font-data`}
                  placeholder="3-101-123456"
                />
                {fieldErrors.cedula_juridica && <p className="mt-1 text-sm text-danger">{fieldErrors.cedula_juridica}</p>}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-ink-dim" htmlFor="company-project">
                  Proyecto
                </label>
                <input
                  id="company-project"
                  value={form.project}
                  onChange={handleChange("project")}
                  className={inputClass("project")}
                  placeholder="Opcional"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-ink-dim" htmlFor="company-address">
                  Dirección *
                </label>
                <input
                  id="company-address"
                  value={form.address}
                  onChange={handleChange("address")}
                  className={inputClass("address")}
                />
                {fieldErrors.address && <p className="mt-1 text-sm text-danger">{fieldErrors.address}</p>}
              </div>
            </div>
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-dim">
              Contacto principal
            </p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-ink-dim" htmlFor="company-contact-name">
                  Nombre de contacto *
                </label>
                <input
                  id="company-contact-name"
                  value={form.contact_name}
                  onChange={handleChange("contact_name")}
                  className={inputClass("contact_name")}
                />
                {fieldErrors.contact_name && <p className="mt-1 text-sm text-danger">{fieldErrors.contact_name}</p>}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-ink-dim" htmlFor="company-contact-id">
                  Cédula *
                </label>
                <input
                  id="company-contact-id"
                  value={form.contact_id}
                  onChange={handleChange("contact_id")}
                  className={`${inputClass("contact_id")} font-data`}
                />
                {fieldErrors.contact_id && <p className="mt-1 text-sm text-danger">{fieldErrors.contact_id}</p>}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-ink-dim" htmlFor="company-contact-position">
                  Cargo *
                </label>
                <input
                  id="company-contact-position"
                  value={form.contact_position}
                  onChange={handleChange("contact_position")}
                  className={inputClass("contact_position")}
                />
                {fieldErrors.contact_position && <p className="mt-1 text-sm text-danger">{fieldErrors.contact_position}</p>}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-ink-dim" htmlFor="company-contact-phone">
                  Teléfono *
                </label>
                <input
                  id="company-contact-phone"
                  value={form.contact_phone}
                  onChange={handlePhoneChange("contact_phone")}
                  className={`${inputClass("contact_phone")} font-data`}
                />
                {fieldErrors.contact_phone && <p className="mt-1 text-sm text-danger">{fieldErrors.contact_phone}</p>}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-ink-dim" htmlFor="company-contact-cell">
                  Celular *
                </label>
                <input
                  id="company-contact-cell"
                  value={form.contact_cell}
                  onChange={handlePhoneChange("contact_cell")}
                  className={`${inputClass("contact_cell")} font-data`}
                />
                {fieldErrors.contact_cell && <p className="mt-1 text-sm text-danger">{fieldErrors.contact_cell}</p>}
              </div>

              <div className="md:col-span-3">
                <label className="mb-2 block text-sm font-medium text-ink-dim" htmlFor="company-email">
                  Correo electrónico *
                </label>
                <input
                  id="company-email"
                  type="email"
                  value={form.email}
                  onChange={handleChange("email")}
                  className={inputClass("email")}
                />
                {fieldErrors.email && <p className="mt-1 text-sm text-danger">{fieldErrors.email}</p>}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-edge bg-surface-2 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-xl border border-edge bg-surface px-4 py-2 text-sm font-medium text-ink transition hover:bg-surface-2"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-xl bg-accent px-5 py-2 text-sm font-medium text-brand-950 shadow-sm transition hover:bg-accent-strong hover:text-white disabled:opacity-60"
          >
            {saving ? "Guardando..." : company ? "Guardar cambios" : "Crear empresa"}
          </button>
        </div>
      </div>
    </div>
  );
}
