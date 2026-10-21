"use client";

import { useEffect, useState } from "react";
import { X, Pencil, Trash2, Plus } from "lucide-react";
import {
  getClassify,
  createclassify,
  updateclassify,
  deleteClassify,
} from "../services/MaterialsService";

import {
  showSuccess,
  showError,
  showConfirm,
} from "../utils/alerts";
import { useRealtimeRefresh } from "../hooks/useRealtimeRefresh";

export default function ModalClassify({ onClose }) {
  const [classify, setClassify] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    name_classify: "",
    description_classify: "",
  });

  const loadClassify = async () => {
    try {
      setLoading(true);

      const data = await getClassify();
      setClassify(data);
    } catch {

      showError(
        "No fue posible cargar las categorías."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClassify();
  }, []);

  useRealtimeRefresh("classify", loadClassify);

  const clearForm = () => {
    setFormData({
      name_classify: "",
      description_classify: "",
    });

    setEditingId(null);
  };

  const handleSave = async () => {
    try {
      if (
        !formData.name_classify.trim() ||
        !formData.description_classify.trim()
      ) {
        showError(
          "Todos los campos son obligatorios."
        );
        return;
      }

      if (formData.name_classify.trim().length > 50) {
        showError("El nombre no puede superar los 50 caracteres.");
        return;
      }

      if (formData.description_classify.trim().length > 150) {
        showError("La descripción no puede superar los 150 caracteres.");
        return;
      }

      if (editingId) {
        await updateclassify({
          id: editingId,
          name_classify: formData.name_classify,
          description_classify:
            formData.description_classify,
        });

        showSuccess(
          "Categoría actualizada correctamente."
        );
      } else {
        await createclassify({
          name_classify: formData.name_classify,
          description_classify:
            formData.description_classify,
        });

        showSuccess(
          "Categoría creada correctamente."
        );
      }

      clearForm();
      await loadClassify();
    } catch (error) {
let message = "Error al actualizar o crear la categoría.";

            try {
                message = JSON.parse(error.message).message;
            } catch {
                message = error.message;
            }
            showError(message);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);

    setFormData({
      name_classify: item.name_classify,
      description_classify:
        item.description_classify,
    });
  };

  const handleDelete = async (id) => {
    const result = await showConfirm(
      "¿Eliminar categoría?",
      "Esta acción no se puede deshacer."
    );

    if (!result.isConfirmed) return;

    try {
      await deleteClassify(id);

      await loadClassify();

      showSuccess(
        "La categoría fue eliminada correctamente."
      );
    } catch (error) {

      let message = "Error al eliminar la categoría.";

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
              Categorías de materiales
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
            <label className="sr-only" htmlFor="classify-name">Categoría</label>
            <input
              id="classify-name"
              type="text"
              maxLength={50}
              placeholder="Categoría"
              value={formData.name_classify}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  name_classify: e.target.value,
                })
              }
              className="rounded-xl border border-edge bg-surface px-4 py-2.5 text-sm text-ink outline-none transition focus:border-materials-strong focus:ring-2 focus:ring-materials/30"
            />

            <label className="sr-only" htmlFor="classify-description">Descripción</label>
            <input
              id="classify-description"
              type="text"
              maxLength={150}
              placeholder="Descripción"
              value={formData.description_classify}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  description_classify:
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
                      Categoría
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
                  {classify.length > 0 ? (
                    classify.map((item) => (
                      <tr
                        key={item.name_classify}
                        className="border-t border-edge transition hover:bg-surface-2/60"
                      >
                        <td className="p-3 text-ink">
                          {item.name_classify}
                        </td>

                        <td className="p-3 text-ink-dim">
                          {item.description_classify}
                        </td>

                        <td className="p-3">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() =>
                                handleEdit(item)
                              }
                              aria-label={`Editar ${item.name_classify}`}
                              title={`Editar ${item.name_classify}`}
                              className="rounded-lg border border-edge p-2 text-ink-dim transition hover:bg-surface-2 hover:text-ink"
                            >
                              <Pencil size={16} />
                            </button>

                            <button
                              onClick={() =>
                                handleDelete(
                                  item.id
                                )
                              }
                              aria-label={`Eliminar ${item.name_classify}`}
                              title={`Eliminar ${item.name_classify}`}
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
                        colSpan="4"
                        className="text-center py-8 text-ink-dim"
                      >
                        No hay categorías
                        registrados.
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
