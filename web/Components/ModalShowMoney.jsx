"use client";

import { useEffect, useState } from "react";
import { X, Pencil, Check } from "lucide-react";
import { getMoney, updateCurrency } from "../services/MaterialsService";
import { showSuccess, showError } from "../utils/alerts";
import { useRealtimeRefresh } from "../hooks/useRealtimeRefresh";

// Deja pasar solo digitos y un punto decimal mientras se escribe, con
// maximo 2 decimales (el tipo de cambio solo maneja 2)
const sanitizeDecimal = (value) => {
  const cleaned = value.replace(/[^0-9.]/g, "");
  const firstDot = cleaned.indexOf(".");
  if (firstDot === -1) return cleaned;
  const integerPart = cleaned.slice(0, firstDot + 1);
  const decimalPart = cleaned.slice(firstDot + 1).replace(/\./g, "");
  return integerPart + decimalPart.slice(0, 2);
};

export default function CurrencyInfo({ onClose }) {
    const [money, setMoney] = useState([]);
    const [loading, setLoading] = useState(true);
    // Cual fila esta en modo edicion (id de la moneda), null si ninguna
    const [editingId, setEditingId] = useState(null);
    const [editValue, setEditValue] = useState("");
    const [saving, setSaving] = useState(false);

    const fetchMoney = async () => {
        try {
            const data = await getMoney();
            setMoney(data);
        } catch {

        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMoney();
    }, []);

    useRealtimeRefresh("currency", fetchMoney);

    const startEdit = (item) => {
        setEditingId(item.id);
        setEditValue(String(item.price));
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditValue("");
    };

    const saveEdit = async (item) => {
        const price = Number(editValue);
        if (!editValue.trim() || !(price > 0)) {
            showError("El tipo de cambio debe ser un número mayor a cero.");
            return;
        }

        setSaving(true);
        try {
            await updateCurrency(item.id, price);
            showSuccess(`Tipo de cambio de ${item.name_currency} actualizado.`);
            setEditingId(null);
            setEditValue("");
            await fetchMoney();
        } catch (err) {
            let message = "No fue posible actualizar el tipo de cambio.";
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-900/55 backdrop-blur-sm p-4">
            <div className="w-full max-w-2xl rounded-2xl border border-edge bg-surface shadow-2xl overflow-hidden">

                {/* HEADER */}
                <div className="flex items-center justify-between border-b border-edge px-6 py-5">
                    <div>
                        <span className="eyebrow text-materials-strong">Materiales</span>
                        <h2 className="text-xl font-semibold text-ink -mt-0.5">
                            Tipos de cambio
                        </h2>
                        <p className="text-sm text-ink-dim mt-1">
                            Moneda base: USD ($)
                        </p>
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

                {/* CONTENT */}
                <div className="p-6">
                    {loading ? (
                        <div className="text-center py-6 text-ink-dim">
                            Cargando tipos de cambio...
                        </div>
                    ) : (
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {money.map((item) => (
                                <div
                                    key={item.name_currency}
                                    className="rounded-xl border border-edge p-4 transition hover:bg-surface-2"
                                >
                                    <div className="flex justify-between items-center gap-3">
                                        <div>
                                            <h3 className="font-semibold text-lg text-ink">
                                                {item.name_currency}
                                            </h3>

                                            <p className="text-xs text-ink-dim">
                                                Actualizado:
                                            </p>

                                            <p className="text-sm text-ink-dim font-data">
                                                {new Date(item.dateUpdate).toLocaleString("es-CR")}
                                            </p>
                                        </div>

                                        {editingId === item.id ? (
                                            <div className="flex items-center gap-2">
                                                <input
                                                    autoFocus
                                                    inputMode="decimal"
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(sanitizeDecimal(e.target.value))}
                                                    className="w-28 rounded-lg border border-edge bg-surface px-3 py-2 text-right font-data text-lg text-ink outline-none transition focus:border-materials-strong focus:ring-2 focus:ring-materials/30"
                                                />
                                                <button
                                                    onClick={() => saveEdit(item)}
                                                    disabled={saving}
                                                    aria-label={`Guardar ${item.name_currency}`}
                                                    title={`Guardar ${item.name_currency}`}
                                                    className="rounded-lg bg-materials p-2 text-white transition hover:bg-materials-strong disabled:opacity-60"
                                                >
                                                    <Check size={16} />
                                                </button>
                                                <button
                                                    onClick={cancelEdit}
                                                    disabled={saving}
                                                    aria-label="Cancelar"
                                                    title="Cancelar"
                                                    className="rounded-lg border border-edge p-2 text-ink-dim transition hover:bg-surface-2"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <div className="text-right">
                                                    <p className="text-2xl font-bold text-materials-strong font-data">
                                                        {Number(item.price).toLocaleString("es-CR", {
                                                            minimumFractionDigits: 2,
                                                            maximumFractionDigits: 2,
                                                        })}
                                                    </p>

                                                    <p className="text-xs text-ink-dim">
                                                        por 1 USD
                                                    </p>
                                                    {item.name_currency !== "USD" && (
                                                        <p className="text-[11px] text-ink-dim">
                                                            Tipo de venta, BCCR
                                                        </p>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => startEdit(item)}
                                                    aria-label={`Editar ${item.name_currency}`}
                                                    title={`Editar ${item.name_currency}`}
                                                    className="rounded-lg border border-edge p-2 text-ink-dim transition hover:bg-surface-2 hover:text-ink"
                                                >
                                                    <Pencil size={16} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {money.length === 0 && (
                                <div className="text-center text-ink-dim py-8">
                                    No hay tipos de cambio disponibles.
                                </div>
                            )}
                        </div>
                    )}
                </div>
                {/* MENSAJE INFORMATIVO */}
                <div className="px-6 pb-4">
                    <div className="rounded-xl border border-materials/25 bg-materials-soft p-3">
                        <p className="text-sm text-materials-strong">
                            El tipo de cambio se actualiza todos los días a las 2:00 a.m. con el <strong>tipo
                            de venta</strong> del dólar publicado por el Banco Central de Costa Rica (BCCR).
                            Un cambio manual dura hasta esa próxima actualización automática, que vuelve a
                            traer el valor oficial desde el BCCR.
                        </p>
                    </div>
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
