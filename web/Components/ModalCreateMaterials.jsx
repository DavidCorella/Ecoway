"use client";

import { useState, useEffect } from "react";
import SearchSelect from "./SearchSelect";
import { createMaterial, getUnits, getMoney, getClassify, getPhysicalState } from "../services/MaterialsService";

import { showSuccess, showError } from "../utils/alerts";

export default function ModalCreateMaterial({
    setShowModal,
    onSuccess
}) {

    const initialForm = {

        description_material: "",
        unit: "",
        currency: "",
        classify: "",
        physical_state: "",
        price: "",
        max_management_days: ""

    };

    const [form, setForm] = useState(initialForm);

    const [errors, setErrors] = useState({});

    const [units, setUnits] = useState([]);

    const [currencies, setCurrencies] = useState([]);

    const [classifies, setClassifies] = useState([]);

    const [physicalStates, setPhysicalStates] = useState([]);

    const loadCatalogs = async () => {

        try {

            const [

                unitsData,
                currenciesData,
                classifyData,
                physicalStateData

            ] = await Promise.all([

                getUnits(),
                getMoney(),
                getClassify(),
                getPhysicalState()

            ]);

            setUnits(unitsData);

            setCurrencies(currenciesData);

            setClassifies(classifyData);

            setPhysicalStates(physicalStateData);

        }
        catch {

            showError("No fue posible cargar los catálogos.");

        }

    };

    const handleChange = (e) => {

        const { name, value } = e.target;

        setForm((prev) => ({

            ...prev,

            [name]: value

        }));

        setErrors((prev) => ({

            ...prev,

            [name]: ""

        }));

    };

    // Deja pasar solo digitos, sin signos ni decimales
    const handleMaxManagementDaysChange = (e) => {
        const value = e.target.value.replace(/[^0-9]/g, "");

        setForm((prev) => ({
            ...prev,
            max_management_days: value
        }));

        setErrors((prev) => ({
            ...prev,
            max_management_days: ""
        }));
    };

    const handleSelect = (field, value) => {
        setForm((prev) => ({

            ...prev,

            [field]: value

        }));

        setErrors((prev) => ({

            ...prev,

            [field]: ""

        }));

    };

    const validateForm = () => {

        const newErrors = {};

        if (!form.description_material.trim()) {

            newErrors.description_material =
                "Ingrese la descripción.";

        } else if (form.description_material.trim().length > 150) {

            newErrors.description_material =
                "La descripción no puede superar los 150 caracteres.";

        }

        if (!form.price) {

            newErrors.price =
                "Ingrese el precio.";

        }
        else if (Number(form.price) <= 0) {

            newErrors.price =
                "El precio debe ser mayor que cero.";

        }

        if (!form.unit) {

            newErrors.unit =
                "Seleccione una unidad.";

        }

        if (!form.currency) {

            newErrors.currency =
                "Seleccione una moneda.";

        }

        if (!form.classify) {

            newErrors.classify =
                "Seleccione una clasificación.";

        }

        if (!form.physical_state) {

            newErrors.physical_state =
                "Seleccione un estado físico.";

        }

        if (!form.max_management_days) {

            newErrors.max_management_days =
                "Ingrese el máximo de días de gestión.";

        }
        else if (Number(form.max_management_days) <= 0) {

            newErrors.max_management_days =
                "El máximo de días de gestión debe ser mayor que cero.";

        }

        setErrors(newErrors);

        return Object.keys(newErrors).length === 0;

    };

    const handleAdd = async () => {

        if (!validateForm()) {

            return;

        }

        try {

            await createMaterial({

                description_material:
                    form.description_material,

                unit:
                    String(form.unit),

                currency:
                    String(form.currency),

                classify:
                    String(form.classify),

                physical_state:
                    String(form.physical_state),

                price:
                    Number(form.price),

                max_management_days:
                    Number(form.max_management_days)

            });

            showSuccess("Material creado correctamente");

            setShowModal(false);

            onSuccess?.();

        }
        catch (error) {

            let message = "Error al actualizar el material.";

            try {
                message = JSON.parse(error.message).message;
            } catch {
                message = error.message;
            }
            showError(message);
        }

    };

    const handleCancel = () => {

        setForm(initialForm);

        setErrors({});

        setShowModal(false);

    };

    useEffect(() => {
        loadCatalogs();
    }, []);

    return (
        <>
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-brand-900/55 backdrop-blur-sm p-4">

                <div className="w-[750px] rounded-2xl bg-surface shadow-2xl border border-edge overflow-hidden animate-in fade-in zoom-in-95">

                    {/* HEADER */}
                    <div className="border-b border-edge px-6 py-4">

                        <span className="eyebrow text-materials-strong">Materiales</span>
                        <h2 className="text-xl font-semibold text-ink -mt-0.5">
                            Crear material
                        </h2>

                        <p className="mt-1 text-sm text-ink-dim">
                            Complete la información para registrar un nuevo material.
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

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                            {/* DESCRIPCIÓN */}

                            <div className="md:col-span-2">

                                <label htmlFor="material-description" className="mb-2 block text-sm font-medium text-ink-dim">
                                    Descripción
                                </label>

                                <input
                                    id="material-description"
                                    type="text"
                                    maxLength={150}
                                    name="description_material"
                                    value={form.description_material}
                                    onChange={handleChange}
                                    placeholder="Descripción del material"
                                    className={`
                                        w-full
                                        rounded-xl
                                        border
                                        bg-surface-2
                                        px-4
                                        py-3
                                        text-sm
                                        text-ink
                                        outline-none
                                        transition

                                        ${errors.description_material
                                            ? "border-danger"
                                            : "border-edge focus:border-materials-strong focus:bg-surface focus:ring-2 focus:ring-materials/30"
                                        }
                                    `}
                                />

                                {errors.description_material && (

                                    <p className="mt-1 text-sm text-danger">
                                        {errors.description_material}
                                    </p>

                                )}

                            </div>

                            {/* PRECIO */}

                            <div>

                                <label htmlFor="material-price" className="mb-2 block text-sm font-medium text-ink-dim">
                                    Precio sugerido por kilogramo
                                </label>

                                <input
                                    id="material-price"
                                    type="number"
                                    step="0.01"
                                    name="price"
                                    value={form.price}
                                    onChange={handleChange}
                                    placeholder="0.00"
                                    className={`
                                        w-full
                                        rounded-xl
                                        border
                                        bg-surface-2
                                        px-4
                                        py-3
                                        text-sm
                                        text-ink
                                        outline-none
                                        transition

                                        ${errors.price
                                            ? "border-danger"
                                            : "border-edge focus:border-materials-strong focus:bg-surface focus:ring-2 focus:ring-materials/30"
                                        }
                                    `}
                                />

                                {errors.price && (

                                    <p className="mt-1 text-sm text-danger">
                                        {errors.price}
                                    </p>

                                )}

                            </div>

                            {/* MAXIMO DE DIAS DE GESTION */}

                            <div>

                                <label htmlFor="material-max-management-days" className="mb-2 block text-sm font-medium text-ink-dim">
                                    Máximo de días de gestión
                                </label>

                                <input
                                    id="material-max-management-days"
                                    type="text"
                                    inputMode="numeric"
                                    name="max_management_days"
                                    value={form.max_management_days}
                                    onChange={handleMaxManagementDaysChange}
                                    placeholder="30"
                                    className={`
                                        w-full
                                        rounded-xl
                                        border
                                        bg-surface-2
                                        px-4
                                        py-3
                                        text-sm
                                        text-ink
                                        outline-none
                                        transition

                                        ${errors.max_management_days
                                            ? "border-danger"
                                            : "border-edge focus:border-materials-strong focus:bg-surface focus:ring-2 focus:ring-materials/30"
                                        }
                                    `}
                                />

                                {errors.max_management_days && (

                                    <p className="mt-1 text-sm text-danger">
                                        {errors.max_management_days}
                                    </p>

                                )}

                            </div>

                            {/* UNIDAD */}

                            <SearchSelect
                                label="Unidad"
                                options={units}
                                value={form.unit}
                                valueField="id"
                                labelField="name_unit"
                                onChange={(value) => handleSelect("unit", value)}
                                error={errors.unit}
                            />

                            {/* MONEDA */}

                            <SearchSelect
                                label="Moneda"
                                placeholder="Buscar moneda..."
                                options={currencies}
                                value={form.currency}
                                valueField="id"
                                labelField="name_currency"
                                onChange={(value) =>
                                    handleSelect("currency", value)
                                }
                                error={errors.currency}
                            />

                            {/* CLASIFICACIÓN */}

                            <SearchSelect
                                label="Categoría de materiales"
                                placeholder="Buscar categoría..."
                                options={classifies}
                                valueField="id"
                                labelField="name_classify"
                                value={form.classify}
                                onChange={(value) =>
                                    handleSelect("classify", value)
                                }
                                error={errors.classify}
                            />

                            {/* ESTADO FÍSICO */}

                            <SearchSelect
                                label="Estado Físico"
                                placeholder="Buscar estado físico..."
                                options={physicalStates}
                                valueField="id"
                                labelField="name_physicalState"
                                value={form.physical_state}
                                onChange={(value) =>
                                    handleSelect("physical_state", value)
                                }
                                error={errors.physical_state}
                            />

                        </div>

                    </div>

                    {/* FOOTER */}

                    <div className="flex items-center justify-end gap-3 border-t border-edge bg-surface-2 px-6 py-4">

                        <button
                            onClick={handleCancel}
                            className="rounded-xl px-4 py-2 text-sm font-medium text-ink-dim transition hover:bg-surface"
                        >
                            Cancelar
                        </button>

                        <button
                            onClick={handleAdd}
                            className="rounded-xl bg-materials px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-materials-strong"
                        >
                            Guardar
                        </button>

                    </div>

                </div>

            </div>

        </>
    );

}
