"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { voidSummary } from "../services/CollectionSummariesService";
import { showSuccess, showError } from "../utils/alerts";

export default function ModalVoidCollectionSummary({ summary, onClose, onVoided }) {
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleVoid = async () => {
    if (!reason.trim()) {
      setError("Indicá el motivo de la anulación.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await voidSummary(summary.id, reason);
      showSuccess(`El resumen ${summary.period_label} fue anulado.`);
      onVoided?.();
    } catch (err) {
      let message = "No fue posible anular el resumen.";
      try {
        message = JSON.parse(err.message).message;
      } catch {
        message = err.message || message;
      }
      showError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-brand-900/55 backdrop-blur-sm p-4">
      <div className="w-full max-w-[420px] rounded-2xl border border-edge bg-surface shadow-2xl overflow-hidden">
        <div className="border-b border-edge px-6 py-4">
          <div className="flex items-center gap-2 text-danger">
            <AlertTriangle size={18} />
            <h2 className="text-lg font-semibold text-ink">Anular resumen</h2>
          </div>
          <p className="text-sm text-ink-dim mt-1">
            El resumen <span className="font-data">{summary.period_label}</span> no se borra —
            queda registrado como anulado, con el motivo, para mantener la trazabilidad.
          </p>
        </div>

        <div className="p-6">
          <label htmlFor="void-summary-reason" className="mb-2 block text-sm font-medium text-ink-dim">
            Motivo de la anulación
          </label>
          <textarea
            id="void-summary-reason"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ej.: se incluyó una acta equivocada, el cliente pidió corregir un precio..."
            className="w-full rounded-xl border border-edge bg-surface-2 px-4 py-2.5 text-sm text-ink outline-none transition focus:border-danger focus:bg-surface focus:ring-2 focus:ring-danger/20"
          />

          {error && <p className="mt-2 text-sm text-danger">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-edge bg-surface-2 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm font-medium text-ink-dim transition hover:bg-surface"
          >
            Cancelar
          </button>

          <button
            onClick={handleVoid}
            disabled={saving}
            className="rounded-xl bg-danger px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:brightness-90 disabled:opacity-60"
          >
            {saving ? "Anulando..." : "Anular resumen"}
          </button>
        </div>
      </div>
    </div>
  );
}
