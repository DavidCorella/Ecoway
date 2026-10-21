"use client";

import { useState, useEffect, useRef } from "react";
import { getNombreById, updateUser, createNotification} from "../services/userServiceAPI";
import { getRoles } from "../services/userService";
import {showSuccess,showError} from "../utils/alerts";

export default function ModalEditUser({ showModal, setShowModal, user, onSave }) {

  const initialForm = {
    id: "",
    nombre: "",
    email: "",
    rol: "",
    procedencia: "Nacional",
    puesto: "",
  };

  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [roles, setRoles] = useState([]);
  const debounceRef = useRef(null);

  const roleEncontrado = roles.find((rol) => rol.name === user?.role);

    const fetchRoles = async () => {
        try {
            const data = await getRoles();
            setRoles(data);
        } catch {

        }
    };

    const fetchNombre = async (id) => {
        try {
           const nombre = await getNombreById(id);

            setForm((prev) => ({
                ...prev,
                nombre,
            }));
        } catch {

        }
    };

    const validateForm = () => {

        const newErrors = {};

        // La cedula es obligatoria y tiene que corresponder a alguien real
        if (!form.id.trim()) {
            newErrors.id = "La identificación es obligatoria";
        }
        if ( form.nombre === "No encontrado" && form.procedencia === "Nacional") {
            newErrors.id = "El ID debe corresponder a un usuario nacional válido";
        }

        // El correo es opcional, pero si lo llenan tiene que ser valido
        if (form.email.trim()) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(form.email)) {
                newErrors.email = "Correo electrónico inválido";
            }
            if (form.email.length > 150) {
                newErrors.email = "El correo no puede superar 150 caracteres";
            }
        }

        if (!form.rol) {
            newErrors.rol =
                "Debe seleccionar un rol";
        }


        if (!form.puesto.trim()) {
            newErrors.puesto = "El puesto es obligatorio";
        }

        setErrors(newErrors);

        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {

        const { name, value } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));

        setErrors((prev) => ({
            ...prev,
            [name]: "",
        }));


        if (name === "id" && value) {

            clearTimeout(debounceRef.current);

            debounceRef.current = setTimeout(() => {
                fetchNombre(value);
            }, 500);
        }


        if (
            name === "procedencia" &&
            value === "Nacional" &&
            form.id
        ) {
            fetchNombre(form.id);
        }
    };

    const handleUpdate = async () => {

        if (!validateForm()) {
            return;
        }

        try {

            const userData = {
                id: user.publicId,
                email:
                    form.email === ""
                        ? null
                        : form.email,
                role: form.rol,
                nationality_id:
                    form.procedencia === "Nacional"
                        ? 1
                        : 2,
                position: form.puesto,
            };
            await updateUser(userData, form.procedencia === "Extranjero"?form.nombre:null);
            await createNotification(
                "Usuario Editado",
                `Se ha Editado el usuario ${form.nombre}.`,
                1
            );
            window.dispatchEvent(
  new Event("notification-created")
);            onSave?.();

            handleCancel();
            showSuccess("Usuario actualizado exitosamente");
        } catch {

            showError("Error al actualizar el usuario");
        }
    };

    const handleCancel = () => {
        resetForm();
        setShowModal(false);
    };

    const resetForm = () => {
        setForm(initialForm);
        setErrors({});
    };

  // Se vuelve a pedir cada vez que se abre el modal (no solo al montar)
  // para que un rol creado en "Roles y permisos" aparezca de una vez,
  // sin tener que recargar la pagina
  useEffect(() => {
    if (showModal) fetchRoles();
  }, [showModal]);

  useEffect(() => {
    if (user && showModal) {
      setForm({
        id: user.id || "",
        nombre: user.name || "",
        email: user.email || "",
        rol: roleEncontrado?.id ?? "",
        procedencia: user.nacionality === "Costa Rica" ? "Nacional" : user.nacionality,
        puesto: user.position || "",
      });
      setErrors({});
    }
  }, [user, showModal, roleEncontrado]);

    if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-brand-900/55 backdrop-blur-sm p-4">

    <div className="w-[700px] rounded-2xl bg-surface shadow-2xl border border-edge overflow-hidden animate-in fade-in zoom-in-95">

      {/* HEADER */}
      <div className="border-b border-edge px-6 py-4">
        <span className="eyebrow text-brand-600">Usuarios</span>
        <h2 className="text-xl font-semibold text-ink -mt-0.5">
          Editar usuario
        </h2>

        <p className="text-sm text-ink-dim mt-1">
          Actualice la información del usuario seleccionado.
        </p>
      </div>

      {/* BODY */}
      <div className="p-6">

        {Object.keys(errors).length > 0 && (
          <div className="mb-4 rounded-lg border border-danger/20 bg-danger-soft px-4 py-3">
            <p className="text-sm text-danger">
              Corrija los campos marcados antes de continuar.
            </p>
          </div>
        )}

        {/* Procedencia */}
        <div className="mb-6 flex gap-6">

          <label className="flex items-center gap-2 font-medium text-ink-dim">
            <input
              disabled
              type="radio"
              name="procedencia"
              value="Nacional"
              checked={form.procedencia === "Nacional"}
              onChange={handleChange}
            />
            Nacional
          </label>

          <label className="flex items-center gap-2 font-medium text-ink-dim">
            <input
              disabled
              type="radio"
              name="procedencia"
              value="Extranjero"
              checked={form.procedencia === "Extranjero"}
              onChange={handleChange}
            />
            Extranjero
          </label>

        </div>

        {/* FORM */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* ID */}
          <div>
            <label htmlFor="edit-user-id" className="sr-only">Identificación</label>
            <input
              id="edit-user-id"
              type={
                form.procedencia === "Nacional"
                  ? "number"
                  : "text"
              }
              name="id"
              disabled
              placeholder="ID"
              value={form.id}
              onChange={handleChange}
              className={`w-full rounded-xl border bg-surface-2 px-4 py-3 text-sm text-ink
              ${
                errors.id
                  ? "border-danger"
                  : "border-edge"
              }`}
            />

            {errors.id && (
              <p className="mt-1 text-sm text-danger">
                {errors.id}
              </p>
            )}
          </div>

          {/* Nombre */}
          <div>
            <label htmlFor="edit-user-nombre" className="sr-only">Nombre</label>
            <input
              id="edit-user-nombre"
              type="text"
              name="nombre"
              placeholder="Nombre"
              value={form.nombre}
              onChange={handleChange}
              disabled={form.procedencia === "Nacional"}
              className="w-full rounded-xl border border-edge bg-surface-2 px-4 py-3 text-sm text-ink disabled:opacity-70"
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="edit-user-email" className="sr-only">Correo electrónico</label>
            <input
              id="edit-user-email"
              type="email"
              name="email"
              placeholder="Correo electrónico"
              value={form.email}
              onChange={handleChange}
              className={`w-full rounded-xl border bg-surface-2 px-4 py-3 text-sm text-ink
              ${
                errors.email
                  ? "border-danger"
                  : "border-edge"
              }`}
            />

            {errors.email && (
              <p className="mt-1 text-sm text-danger">
                {errors.email}
              </p>
            )}
          </div>

          {/* Rol */}
          <div>
            <label htmlFor="edit-user-rol" className="sr-only">Rol</label>
            <select
              id="edit-user-rol"
              name="rol"
              value={form.rol}
              onChange={handleChange}
              className={`w-full rounded-xl border bg-surface-2 px-4 py-3 text-sm text-ink
              ${
                errors.rol
                  ? "border-danger"
                  : "border-edge"
              }`}
            >
              <option value="">
                Seleccione el rol
              </option>

              {roles.map((rol) => (
                <option
                  key={rol.id}
                  value={rol.id}
                >
                  {rol.name}
                </option>
              ))}
            </select>

            {errors.rol && (
              <p className="mt-1 text-sm text-danger">
                {errors.rol}
              </p>
            )}
          </div>

          {/* Puesto */}
          <div>
            <label htmlFor="edit-user-puesto" className="sr-only">Puesto</label>
            <input
              id="edit-user-puesto"
              type="text"
              name="puesto"
              placeholder="Puesto"
              value={form.puesto}
              onChange={handleChange}
              className={`w-full rounded-xl border bg-surface-2 px-4 py-3 text-sm text-ink
              ${
                errors.puesto
                  ? "border-danger"
                  : "border-edge"
              }`}
            />

            {errors.puesto && (
              <p className="mt-1 text-sm text-danger">
                {errors.puesto}
              </p>
            )}
          </div>

        </div>

      </div>

      {/* FOOTER */}
      <div className="flex items-center justify-end gap-3 border-t border-edge bg-surface-2 px-6 py-4">

        <button
          onClick={handleCancel}
          className="px-4 py-2 rounded-xl text-sm font-medium text-ink-dim transition hover:bg-surface"
        >
          Cancelar
        </button>

        <button
          onClick={handleUpdate}
          className="px-5 py-2 rounded-xl bg-brand-700 text-white text-sm font-medium shadow-sm transition hover:bg-brand-600"
        >
          Actualizar
        </button>

      </div>

    </div>
    </div>
  );
}
