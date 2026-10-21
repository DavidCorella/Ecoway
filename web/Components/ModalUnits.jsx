"use client";

import { useEffect, useState } from "react";
import { X, Pencil, Trash2, Plus } from "lucide-react";
import {
  getUnits,
  createUnit,
  updateUnit,
  deleteUnit,
} from "../services/MaterialsService";

import {
  showSuccess,
  showError,
  showConfirm,
} from "../utils/alerts";
import { useRealtimeRefresh } from "../hooks/useRealtimeRefresh";

export default function ModalUnits({ onClose }) {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    name_unit: "",
    description_unit: "",
  });

  const loadUnits = async () => {
    try {
      setLoading(true);

      const data = await getUnits();
      setUnits(data);
    } catch {

      await showError(
        "No fue posible cargar las unidades."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUnits();
  }, []);

  useRealtimeRefresh("units", loadUnits);

  const clearForm = () => {
    setFormData({
      name_unit: "",
      description_unit: "",
    });

    setEditingId(null);
  };

  const handleSave = async () => {
    try {
      if (
        !formData.name_unit.trim() ||
        !formData.description_unit.trim()
      ) {
        await showError(
          "Todos los campos son obligatorios."
        );
        return;
      }

      // El backend solo acepta abreviaturas cortas para la unidad (ej: "kg", "lt")
      if (formData.name_unit.trim().length > 4) {
        await showError("La unidad debe ser una abreviatura de máximo 4 caracteres.");
        return;
      }

      if (formData.description_unit.trim().length > 149) {
        await showError("La descripción no puede superar los 149 caracteres.");
        return;
      }

      if (editingId) {
        await updateUnit({
          id: editingId,
          name_unit: formData.name_unit,
          description_unit:
            formData.description_unit,
        });

        await showSuccess(
          "La unidad fue actualizada correctamente."
        );
      } else {
        await createUnit({
          name_unit: formData.name_unit,
          description_unit:
            formData.description_unit,
        });

        await showSuccess(
          "La unidad fue creada correctamente."
        );
      }

      clearForm();
      await loadUnits();
    } catch (error) {

      let message = "Error al actualizar o crear la unidad.";

            try {
                message = JSON.parse(error.message).message;
            } catch {
                message = error.message;
            }
            showError(message);
    }
  };

  const handleEdit = (unit) => {
    setEditingId(unit.id);

    setFormData({
      name_unit: unit.name_unit,
      description_unit: unit.description_unit,
    });
  };

  const handleDelete = async (id) => {
    const result = await showConfirm(
      "¿Eliminar unidad?",
      "Esta acción no se puede deshacer."
    );

    if (!result.isConfirmed) return;

    try {
      await deleteUnit(id);

      await loadUnits();

      showSuccess(
        "La unidad fue eliminada correctamente."
      );
    } catch (error) {
      let message = "Error al eliminar la unidad.";

            try {
                message = JSON.parse(error.message).message;
            } catch {
                message = error.message;
            }
            showError(message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-900/55 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl rounded-2xl border border-edge bg-surface shadow-2xl overflow-hidden">

        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-edge px-6 py-5">
          <div>
            <span className="eyebrow text-materials-strong">Materiales</span>
            <h2 className="text-xl font-semibold text-ink -mt-0.5">
              Gestión de unidades
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

        {/* FORM */}
        <div className="p-5 border-b border-edge bg-surface-2">
          <div className="grid grid-cols-2 gap-4">
            <label className="sr-only" htmlFor="unit-name">Unidad</label>
            <input
              id="unit-name"
              type="text"
              maxLength={4}
              placeholder="Unidad"
              value={formData.name_unit}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  name_unit: e.target.value,
                })
              }
              className="rounded-xl border border-edge bg-surface px-4 py-2.5 text-sm text-ink outline-none transition focus:border-materials-strong focus:ring-2 focus:ring-materials/30"
            />

            <label className="sr-only" htmlFor="unit-description">Descripción</label>
            <input
              id="unit-description"
              type="text"
              maxLength={149}
              placeholder="Descripción"
              value={formData.description_unit}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  description_unit:
                    e.target.value,
                })
              }
              className="rounded-xl border border-edge bg-surface px-4 py-2.5 text-sm text-ink outline-none transition focus:border-materials-strong focus:ring-2 focus:ring-materials/30"
            />
          </div>

          <div className="flex justify-end gap-2 mt-4">
            {editingId && (
              <button
                onClick={clearForm}
                className="px-4 py-2 rounded-xl text-sm font-medium text-ink-dim transition hover:bg-surface"
              >
                Cancelar
              </button>
            )}

            <button
              onClick={handleSave}
              className="flex items-center gap-2 rounded-xl bg-materials px-4 py-2 text-sm font-medium text-white transition hover:bg-materials-strong"
            >
              <Plus size={18} />

              {editingId
                ? "Actualizar"
                : "Crear"}
            </button>
          </div>
        </div>

        {/* TABLA */}
        <div className="p-5">
          {loading ? (
            <div className="text-center py-10 text-ink-dim">
              Cargando...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full rounded-xl border border-edge overflow-hidden">
                <thead className="bg-surface-2">
                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-ink-dim">
                    <th className="p-3">
                      Unidad
                    </th>
                    <th className="p-3">
                      Descripción
                    </th>
                    <th className="p-3 text-center">
                      Acciones
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {units.length > 0 ? (
                    units.map((unit) => (
                      <tr
                        key={unit.id}
                        className="border-t border-edge transition hover:bg-surface-2/60"
                      >
                        <td className="p-3 text-ink">
                          {unit.name_unit}
                        </td>

                        <td className="p-3 text-ink-dim">
                          {unit.description_unit}
                        </td>

                        <td className="p-3">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() =>
                                handleEdit(unit)
                              }
                              aria-label={`Editar ${unit.name_unit}`}
                              title={`Editar ${unit.name_unit}`}
                              className="rounded-lg border border-edge p-2 text-ink-dim transition hover:bg-surface-2 hover:text-ink"
                            >
                              <Pencil size={16} />
                            </button>

                            <button
                              onClick={() =>
                                handleDelete(unit.id)
                              }
                              aria-label={`Eliminar ${unit.name_unit}`}
                              title={`Eliminar ${unit.name_unit}`}
                              className="rounded-lg border border-danger/20 bg-danger-soft p-2 text-danger transition hover:brightness-95"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="3"
                        className="text-center py-8 text-ink-dim"
                      >
                        No hay unidades registradas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
