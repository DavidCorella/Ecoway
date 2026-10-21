"use client";

import { useState, useEffect, useRef } from "react";
import { Eye, EyeOff } from "lucide-react";
import { getNombreById, createUser, createNotification } from "../services/userServiceAPI";
import { getRoles } from "../services/userService";
import { usePermissions } from "../Context/PermissionContext";
import {showSuccess,showError} from "../utils/alerts";

export default function ModalCreateUser({
    showModal,
    setShowModal,
}) {

    const initialForm = {
        id: "",
        nombre: "",
        email: "",
        rol: "",
        procedencia: "Nacional",
        password: "",
        puesto: "",
    };

    const { getScreenId} = usePermissions();

    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [roles, setRoles] = useState([]);
    const [nombrefound, setnombrefound] = useState(false);
    const [form, setForm] = useState({
        id: "",
        nombre: "",
        email: "",
        rol: "",
        procedencia: "Nacional",
        password: "",
        puesto: "",
    });

    const debounceRef = useRef(null);

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

            if (nombre === "No encontrado") {
                setnombrefound(true);

                setForm((prev) => ({
                    ...prev,
                    nombre: "",
                }));
            } else {
                setnombrefound(false);

                setForm((prev) => ({
                    ...prev,
                    nombre,
                }));
            }
        } catch {
        }
    };

    const validateForm = () => {

        const newErrors = {};


        if (!form.id.trim()) {
            newErrors.id = "La identificación es obligatoria";
        }

        if (
            form.nombre === "No encontrado" &&
            form.procedencia === "Nacional"
        ) {
            newErrors.id =
                "El ID debe corresponder a un usuario nacional válido";
        }


        if (form.email.trim()) {

            const emailRegex =
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!emailRegex.test(form.email)) {
                newErrors.email =
                    "Correo electrónico inválido";
            }

            if (form.email.length > 150) {
                newErrors.email =
                    "El correo no puede superar 150 caracteres";
            }
        }


        if (!form.password) {

            newErrors.password =
                "La contraseña es obligatoria";

        } else {

            if (form.password.length < 8) {
                newErrors.password =
                    "Debe tener mínimo 8 caracteres";
            }

            if (form.password.length > 255) {
                newErrors.password =
                    "Máximo 255 caracteres";
            }

            const strongPassword =
                /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,255}$/;

            if (!strongPassword.test(form.password)) {
                newErrors.password =
                    "Debe ser de 8 o mas caracteres, contener mayúscula, minúscula, número y símbolo";
            }
        }


        if (!form.rol) {
            newErrors.rol =
                "Debe seleccionar un rol";
        }


        if (!form.puesto.trim()) {
            newErrors.puesto =
                "El puesto es obligatorio";
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

    const handleAdd = async () => {

        if (!validateForm()) {
            return;
        }

        try {

            const userData = {
                id: form.id,
                email:
                    form.email === ""
                        ? null
                        : form.email,
                password: form.password,
                role: form.rol,
                nationality_id:
                    form.procedencia === "Nacional"
                        ? 1
                        : 2,
                is_active: true,
                position: form.puesto,
            };
            await createUser(userData, form.nombre);
            await createNotification(
                "Usuario Creado",
                `Se ha creado el usuario ${form.nombre}.`,
                getScreenId("Users")
            );
            window.dispatchEvent(
                new Event("notification-created")
            );
            setShowModal(false);
            showSuccess("Usuario creado exitosamente");
        } catch (error) {
            let message = "Error al crear el usuario.";

            try {
                message = JSON.parse(error.message).message;
            } catch {
                message = error.message;
            }
            showError(message);
        }

        resetForm();
    };

    const handleCancel = () => {
        resetForm();
        setShowModal(false);
    };

    const resetForm = () => {
        setForm(initialForm);
        setErrors({});
        setShowPassword(false);
    };

    // Se vuelve a pedir cada vez que se abre el modal (no solo al montar)
    // para que un rol creado en "Roles y permisos" aparezca de una vez,
    // sin tener que recargar la pagina
    useEffect(() => {
        if (showModal) fetchRoles();
    }, [showModal]);

    if (!showModal) return null;

    return (
        <>
            {showModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-brand-900/55 backdrop-blur-sm p-4">

                    <div className="w-[700px] rounded-2xl bg-surface shadow-2xl border border-edge overflow-hidden animate-in fade-in zoom-in-95">

                        {/* HEADER */}
                        <div className="border-b border-edge px-6 py-4">
                            <h2 className="text-xl font-semibold text-ink">
                                👤 Crear Usuario
                            </h2>

                            <p className="mt-1 text-sm text-ink-dim">
                                Complete la información para registrar un nuevo usuario en el sistema.
                            </p>
                        </div>

                        {/* BODY */}
                        <div className="p-6 space-y-5">

                            {Object.keys(errors).length > 0 && (
                                <div className="rounded-lg border border-danger/20 bg-danger-soft px-4 py-3">
                                    <p className="text-sm text-danger">
                                        Corrija los campos marcados antes de continuar.
                                    </p>
                                </div>
                            )}

                            {/* PROCEDENCIA */}
                            <div>

                                <label className="mb-3 block text-sm font-medium text-ink-dim">
                                    Procedencia
                                </label>

                                <div className="flex gap-6">

                                    <label className="flex items-center gap-2 rounded-xl border border-edge px-4 py-3 cursor-pointer text-ink hover:border-brand-500 transition">
                                        <input
                                            type="radio"
                                            name="procedencia"
                                            value="Nacional"
                                            checked={form.procedencia === "Nacional"}
                                            onChange={handleChange}
                                        />
                                        Nacional
                                    </label>

                                    <label className="flex items-center gap-2 rounded-xl border border-edge px-4 py-3 cursor-pointer text-ink hover:border-brand-500 transition">
                                        <input
                                            type="radio"
                                            name="procedencia"
                                            value="Extranjero"
                                            checked={form.procedencia === "Extranjero"}
                                            onChange={handleChange}
                                        />
                                        Extranjero
                                    </label>

                                </div>

                            </div>

                            {/* FORMULARIO */}
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                                {/* ID */}
                                <div>
                                    <label htmlFor="new-user-id" className="sr-only">
                                        Identificación
                                    </label>
                                    <input
                                        id="new-user-id"
                                        type={
                                            form.procedencia === "Nacional"
                                                ? "number"
                                                : "text"
                                        }
                                        name="id"
                                        placeholder="Identificación"
                                        value={form.id}
                                        onChange={handleChange}
                                        className={`w-full rounded-xl border bg-surface-2 px-4 py-3 text-sm text-ink outline-none transition ${
                                            errors.id
                                                ? "border-danger"
                                                : "border-edge focus:border-brand-600 focus:bg-surface focus:ring-2 focus:ring-brand-600/20"
                                        }`}
                                    />

                                    {errors.id && (
                                        <p className="mt-1 text-sm text-danger">
                                            {errors.id}
                                        </p>
                                    )}
                                </div>

                                {/* NOMBRE */}
                                <div>
                                    <label htmlFor="new-user-nombre" className="sr-only">
                                        Nombre completo
                                    </label>
                                    <input
                                        id="new-user-nombre"
                                        type="text"
                                        name="nombre"
                                        placeholder="Nombre completo"
                                        value={form.nombre}
                                        onChange={handleChange}
                                        disabled={
                                            form.procedencia === "Nacional" ||
                                            (!nombrefound &&
                                                form.procedencia === "Extranjero")
                                        }
                                        className="w-full rounded-xl border border-edge bg-surface-2 px-4 py-3 text-sm text-ink outline-none transition focus:border-brand-600 focus:bg-surface focus:ring-2 focus:ring-brand-600/20 disabled:opacity-70"
                                    />
                                </div>

                                {/* EMAIL */}
                                <div>
                                    <label htmlFor="new-user-email" className="sr-only">
                                        Correo electrónico
                                    </label>
                                    <input
                                        id="new-user-email"
                                        type="email"
                                        name="email"
                                        placeholder="Correo electrónico"
                                        value={form.email}
                                        onChange={handleChange}
                                        className={`w-full rounded-xl border bg-surface-2 px-4 py-3 text-sm text-ink outline-none transition ${
                                            errors.email
                                                ? "border-danger"
                                                : "border-edge focus:border-brand-600 focus:bg-surface focus:ring-2 focus:ring-brand-600/20"
                                        }`}
                                    />

                                    {errors.email && (
                                        <p className="mt-1 text-sm text-danger">
                                            {errors.email}
                                        </p>
                                    )}
                                </div>

                                {/* PASSWORD */}
                                <div>
                                    <label htmlFor="new-user-password" className="sr-only">
                                        Contraseña
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="new-user-password"
                                            type={showPassword ? "text" : "password"}
                                            name="password"
                                            autoComplete="new-password"
                                            placeholder="Contraseña"
                                            value={form.password}
                                            onChange={handleChange}
                                            className={`w-full rounded-xl border bg-surface-2 px-4 py-3 pr-12 text-sm text-ink outline-none transition ${
                                                errors.password
                                                    ? "border-danger"
                                                    : "border-edge focus:border-brand-600 focus:bg-surface focus:ring-2 focus:ring-brand-600/20"
                                            }`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                                            title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-dim hover:text-ink transition"
                                        >
                                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>

                                    {errors.password && (
                                        <p className="mt-1 text-sm text-danger">
                                            {errors.password}
                                        </p>
                                    )}
                                </div>

                                {/* ROL */}
                                <div>
                                    <label htmlFor="new-user-rol" className="sr-only">Rol</label>
                                    <select
                                        id="new-user-rol"
                                        name="rol"
                                        value={form.rol}
                                        onChange={handleChange}
                                        className={`w-full rounded-xl border bg-surface-2 px-4 py-3 text-sm text-ink outline-none transition ${
                                            errors.rol
                                                ? "border-danger"
                                                : "border-edge focus:border-brand-600 focus:bg-surface focus:ring-2 focus:ring-brand-600/20"
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

                                {/* PUESTO */}
                                <div>
                                    <label htmlFor="new-user-puesto" className="sr-only">Puesto</label>
                                    <input
                                        id="new-user-puesto"
                                        type="text"
                                        name="puesto"
                                        placeholder="Puesto"
                                        value={form.puesto}
                                        onChange={handleChange}
                                        className={`w-full rounded-xl border bg-surface-2 px-4 py-3 text-sm text-ink outline-none transition ${
                                            errors.puesto
                                                ? "border-danger"
                                                : "border-edge focus:border-brand-600 focus:bg-surface focus:ring-2 focus:ring-brand-600/20"
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
                                className="rounded-xl px-4 py-2 text-sm font-medium text-ink-dim hover:bg-surface transition"
                            >
                                Cancelar
                            </button>

                            <button
                                onClick={handleAdd}
                                className="rounded-xl bg-brand-700 px-5 py-2 text-white text-sm font-medium shadow-sm hover:bg-brand-600 transition"
                            >
                                Guardar
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </>
    );
}
