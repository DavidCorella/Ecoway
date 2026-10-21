"use client";

import { useState, useEffect } from "react";
import SearchSelect from "./SearchSelect";
import {
    getUnits,
    getMoney,
    getClassify,
    getPhysicalState,
    updateMaterial
} from "../services/MaterialsService";

import { showSuccess, showError } from "../utils/alerts";

export default function ModalEditMaterial({
    setShowModal,
    onSuccess,
    material
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

    useEffect(() => {

        const load = async () => {

            try {

                const [u, c, cl, ps] = await Promise.all([
                    getUnits(),
                    getMoney(),
                    getClassify(),
                    getPhysicalState()
                ]);

                setUnits(u);
                setCurrencies(c);
                setClassifies(cl);
                setPhysicalStates(ps);

                if (material) {

                    const unitSelected = u.find(
                        x => x.name_unit === material.unit
                    );

                    const currencySelected = c.find(
                        x => x.name_currency === material.currency
                    );

                    const classifySelected = cl.find(
                        x => x.name_classify === material.classify
                    );

                    const physicalSelected = ps.find(
                        x => x.name_physicalState === material.physical_state
                    );

                    setForm({
                        description_material: material.description_material,
                        price: material.price,
                        max_management_days: material.max_management_days ?? "",

                        unit: unitSelected?.id ?? "",
                        currency: currencySelected?.id ?? "",
                        classify: classifySelected?.id ?? "",
                        physical_state: physicalSelected?.id ?? ""
                    });

                }

            } catch {
                showError("Error cargando catálogos");

            }

        };

        load();

    }, [material]);

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
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

        const err = {};

        if (!form.description_material.trim()) {
            err.description_material = "Ingrese la descripción.";
        } else if (form.description_material.trim().length > 150) {
            err.description_material = "La descripción no puede superar los 150 caracteres.";
        }

        if (!form.price) {
            err.price = "Ingrese el precio.";
        } else if (Number(form.price) <= 0) {
            err.price = "El precio debe ser mayor que cero.";
        }

        if (!form.unit) {
            err.unit = "Seleccione una unidad.";
        }

        if (!form.currency) {
            err.currency = "Seleccione una moneda.";
        }

        if (!form.classify) {
            err.classify = "Seleccione una clasificación.";
        }

        if (!form.physical_state) {
            err.physical_state = "Seleccione un estado físico.";
        }

        if (!form.max_management_days) {
            err.max_management_days = "Ingrese el máximo de días de gestión.";
        } else if (Number(form.max_management_days) <= 0) {
            err.max_management_days = "El máximo de días de gestión debe ser mayor que cero.";
        }

        setErrors(err);

        return Object.keys(err).length === 0;
    };

    const handleUpdate = async () => {
        if (!validateForm()) return;

        try {
            await updateMaterial({
                id: material.id,
                description_material: form.description_material,
                unit: String(form.unit),
                currency: String(form.currency),
                classify: String(form.classify),
                physical_state: String(form.physical_state),
                price: Number(form.price),
                max_management_days: Number(form.max_management_days)
            });

            showSuccess("Material actualizado correctamente");

            setShowModal(false);
            onSuccess?.();

        } catch (error) {

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
        setShowModal(false);
        setForm(initialForm);
        setErrors({});
    };

    if (!material) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-brand-900/55 backdrop-blur-sm p-4">

            <div className="w-[750px] rounded-2xl bg-surface shadow-2xl border border-edge overflow-hidden">

                {/* HEADER */}
                <div className="border-b border-edge px-6 py-4">
                    <span className="eyebrow text-materials-strong">Materiales</span>
                    <h2 className="text-xl font-semibold text-ink -mt-0.5">
                        Editar material
                    </h2>
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

                    <div className="md:col-span-2">

                        <label htmlFor="edit-material-description" className="mb-2 block text-sm font-medium text-ink-dim">
                            Descripción
                        </label>

                        <input
                            id="edit-material-description"
                            type="text"
                            maxLength={150}
                            name="description_material"
                            value={form.description_material}
                            onChange={handleChange}
                            placeholder="Descripción del material"
                            className={`w-full rounded-xl border bg-surface-2 px-4 py-3 text-sm text-ink outline-none transition ${errors.description_material
                                    ? "border-danger"
                                    : "border-edge focus:border-materials-strong focus:bg-surface focus:ring-2 focus:ring-materials/30"
                                }`}
                        />

                        {errors.description_material && (
                            <p className="mt-1 text-sm text-danger">
                                {errors.description_material}
                            </p>
                        )}

                    </div>

                    <div>
                        <label htmlFor="edit-material-price" className="mb-2 block text-sm font-medium text-ink-dim">
                            Precio sugerido por kilogramo
                        </label>

                        <input
                            id="edit-material-price"
                            name="price"
                            type="number"
                            step="0.01"
                            value={form.price}
                            onChange={handleChange}
                            placeholder="0.00"
                            className={`w-full rounded-xl border bg-surface-2 px-4 py-3 text-sm text-ink outline-none transition ${errors.price
                                ? "border-danger"
                                : "border-edge focus:border-materials-strong focus:bg-surface focus:ring-2 focus:ring-materials/30"
                                }`}
                        />

                        {errors.price && (
                            <p className="mt-1 text-sm text-danger">
                                {errors.price}
                            </p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="edit-material-max-management-days" className="mb-2 block text-sm font-medium text-ink-dim">
                            Máximo de días de gestión
                        </label>

                        <input
                            id="edit-material-max-management-days"
                            name="max_management_days"
                            type="text"
                            inputMode="numeric"
                            value={form.max_management_days}
                            onChange={handleMaxManagementDaysChange}
                            placeholder="30"
                            className={`w-full rounded-xl border bg-surface-2 px-4 py-3 text-sm text-ink outline-none transition ${errors.max_management_days
                                ? "border-danger"
                                : "border-edge focus:border-materials-strong focus:bg-surface focus:ring-2 focus:ring-materials/30"
                                }`}
                        />

                        {errors.max_management_days && (
                            <p className="mt-1 text-sm text-danger">
                                {errors.max_management_days}
                            </p>
                        )}
                    </div>

                    <SearchSelect
                        label="Unidad"
                        options={units}
                        value={form.unit}
                        valueField="id"
                        labelField="name_unit"
                        onChange={(v) => handleSelect("unit", v)}
                        error={errors.unit}
                    />

                    <SearchSelect
                        label="Moneda"
                        options={currencies}
                        value={form.currency}
                        valueField="id"
                        labelField="name_currency"
                        onChange={(v) => handleSelect("currency", v)}
                        error={errors.currency}
                    />

                    <SearchSelect
                        label="Categoría de materiales"
                        options={classifies}
                        value={form.classify}
                        valueField="id"
                        labelField="name_classify"
                        onChange={(v) => handleSelect("classify", v)}
                        error={errors.classify}
                    />

                    <SearchSelect
                        label="Estado Físico"
                        options={physicalStates}
                        value={form.physical_state}
                        valueField="id"
                        labelField="name_physicalState"
                        onChange={(v) => handleSelect("physical_state", v)}
                        error={errors.physical_state}
                    />
                </div>

                {/* FOOTER */}
                <div className="flex justify-end gap-3 border-t border-edge bg-surface-2 px-6 py-4">

                    <button
                        onClick={handleCancel}
                        className="rounded-xl px-4 py-2 text-sm font-medium text-ink-dim transition hover:bg-surface"
                    >
                        Cancelar
                    </button>

                    <button
                        onClick={handleUpdate}
                        className="rounded-xl bg-materials px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-materials-strong"
                    >
                        Actualizar
                    </button>

                </div>

            </div>
        </div>
    );
}
