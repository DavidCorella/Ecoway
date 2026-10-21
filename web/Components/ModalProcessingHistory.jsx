"use client";

import { X, History } from "lucide-react";

const kg = (value) =>
  Number(value ?? 0).toLocaleString("es-CR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Igual que processed_at en TicketsManagementView: es un instante real (se
// guarda con hora incluida), asi que si se le aplica zona horaria normal
function formatDate(value) {
  return new Date(value).toLocaleString("es-CR");
}

// Historial de procesamientos parciales de una linea de acta de entrada.
// Es de solo lectura — el procesado en si se hace desde la tabla, este
// modal solo muestra el detalle de cada corte que ya se registro
export default function ModalProcessingHistory({ item, onClose }) {
  if (!item) return null;

  const processings = item.processings ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-900/55 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl border border-edge bg-surface shadow-2xl overflow-hidden">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-edge px-6 py-5">
          <div>
            <span className="eyebrow text-entrada-strong">Acta {item.ticket_number}</span>
            <h2 className="text-xl font-semibold text-ink -mt-0.5">Historial de procesado</h2>
            <p className="text-sm text-ink-dim mt-1">{item.material_description}</p>
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

        {/* RESUMEN */}
        <div className="grid grid-cols-3 gap-3 px-6 pt-5">
          <div className="rounded-xl border border-edge p-3 text-center">
            <p className="text-xs text-ink-dim">Cantidad</p>
            <p className="font-data font-semibold text-ink">{kg(item.quantity_kg)} kg</p>
          </div>
          <div className="rounded-xl border border-edge p-3 text-center">
            <p className="text-xs text-ink-dim">Procesado</p>
            <p className="font-data font-semibold text-entrada-strong">{kg(item.processed_kg)} kg</p>
          </div>
          <div className="rounded-xl border border-edge p-3 text-center">
            <p className="text-xs text-ink-dim">Disponible</p>
            <p className="font-data font-semibold text-ink">
              {kg(Math.max(0, item.quantity_kg - item.consumed_kg - item.processed_kg))} kg
            </p>
          </div>
        </div>

        {/* CONTENT */}
        <div className="p-6">
          {processings.length > 0 ? (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {[...processings]
                .sort((a, b) => new Date(b.processed_at) - new Date(a.processed_at))
                .map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-xl border border-edge p-3"
                  >
                    <div className="flex items-center gap-2 text-ink-dim">
                      <History size={15} />
                      <span className="text-sm">{formatDate(p.processed_at)}</span>
                    </div>
                    <span className="font-data font-semibold text-ink">{kg(p.quantity_kg)} kg</span>
                  </div>
                ))}
            </div>
          ) : (
            <div className="rounded-xl border border-edge bg-surface-2/60 py-8 text-center text-ink-dim">
              Todavía no se procesó nada de este material.
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="flex justify-end border-t border-edge bg-surface-2 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-xl border border-edge bg-surface px-4 py-2 text-sm font-medium text-ink transition hover:bg-surface-2"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
