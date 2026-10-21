"use client";

import { useEffect, useState } from "react";
import { X, FileSpreadsheet, FileDown } from "lucide-react";

// Selector de columnas para exportar a Excel o PDF, reutilizable en
// cualquier tabla del sistema. columns es [{ key, label }]; todas quedan
// marcadas por defecto cada vez que se abre
export default function ExportColumnPicker({ open, format, columns, onCancel, onConfirm }) {
  const [selected, setSelected] = useState(() => new Set(columns.map((c) => c.key)));

  useEffect(() => {
    if (open) setSelected(new Set(columns.map((c) => c.key)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const toggle = (key) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const allSelected = selected.size === columns.length;

  const handleConfirm = () => {
    if (selected.size === 0) return;
    // se manda en el mismo orden en que se definieron las columnas, no en
    // el orden en que se fueron marcando
    onConfirm(columns.filter((c) => selected.has(c.key)).map((c) => c.key));
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-brand-900/55 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-edge bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-edge px-6 py-4">
          <div className="flex items-center gap-2">
            {format === "pdf" ? (
              <FileDown size={18} className="text-ink-dim" />
            ) : (
              <FileSpreadsheet size={18} className="text-ink-dim" />
            )}
            <h2 className="text-lg font-semibold text-ink">
              Exportar a {format === "pdf" ? "PDF" : "Excel"}
            </h2>
          </div>
          <button
            onClick={onCancel}
            className="rounded-lg p-1.5 text-ink-dim transition hover:bg-surface-2 hover:text-ink"
            aria-label="Cerrar"
            title="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-6 py-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm text-ink-dim">Elegí qué columnas incluir</p>
            <button
              onClick={() =>
                setSelected(allSelected ? new Set() : new Set(columns.map((c) => c.key)))
              }
              className="text-sm font-medium text-accent-strong hover:underline"
            >
              {allSelected ? "Ninguna" : "Todas"}
            </button>
          </div>

          <div className="space-y-1">
            {columns.map((c) => (
              <label
                key={c.key}
                className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-surface-2"
              >
                <input
                  type="checkbox"
                  checked={selected.has(c.key)}
                  onChange={() => toggle(c.key)}
                  className="h-4 w-4 cursor-pointer accent-accent"
                />
                <span className="text-sm text-ink">{c.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-edge bg-surface-2 px-6 py-4">
          <p className="text-xs text-ink-dim">
            {selected.size === 0
              ? "Seleccioná al menos una columna."
              : `${selected.size} de ${columns.length} columnas`}
          </p>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="rounded-xl border border-edge bg-surface px-4 py-2 text-sm font-medium text-ink transition hover:bg-surface-2"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={selected.size === 0}
              className="rounded-xl bg-accent px-5 py-2 text-sm font-medium text-brand-950 shadow-sm transition hover:bg-accent-strong hover:text-white disabled:opacity-60"
            >
              Exportar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
