"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { getNotifications, markAsRead } from "../services/userServiceAPI";
import { useRealtimeRefresh } from "../hooks/useRealtimeRefresh";


export default function ModalNotification({
    show,
    onClose,
    onPasswordNotification
}) {


    const [notifications, setNotifications] = useState([]);

    const fetchNotifications = async () => {
        try {

            const data = await getNotifications();

            setNotifications(data);



        } catch {
        }
    };

    const handleNotificationClick = async (notification) => {

  if (notification.action === "CHANGE PASSWORD") {

    onPasswordNotification(notification);

    return;
  }

  if (notification.id) {
    await markAsRead(notification.id);
    window.dispatchEvent(
  new Event("notification-read")
);
    setNotifications(prev =>
      prev.filter(x => x.id !== notification.id)
    );
  }
};

    useEffect(() => {
        if (show) {
            fetchNotifications();
        }
    }, [show]);

    // Solo se suscribe mientras el desplegable esta abierto
    useRealtimeRefresh(show ? "notifications" : null, fetchNotifications);

    if (!show) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-brand-900/55 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <div
                className="w-full max-w-[550px] rounded-2xl border border-edge bg-surface shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-edge px-6 py-5">
                    <div className="flex items-center gap-2">
                        <Bell size={20} className="text-brand-600" />
                        <h2 className="text-xl font-semibold text-ink">
                            Notificaciones
                        </h2>
                    </div>

                    <span className="font-data rounded-full bg-brand-50 px-3 py-1 text-sm font-medium text-brand-700">
                        {notifications.length} nuevas
                    </span>
                </div>

                {/* Lista */}
                <div className="max-h-[450px] space-y-3 overflow-y-auto p-6">
                    {notifications.length === 0 ? (
                        <div className="py-10 text-center text-ink-dim">
                            No tienes notificaciones pendientes.
                        </div>
                    ) : (
                        notifications.map((n) => (
                            <div
                                key={n.id}
                                role="button"
                                tabIndex={0}
                                onClick={() =>
                                    handleNotificationClick(n)
                                }
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                        handleNotificationClick(n);
                                    }
                                }}
                                title={
                                    n.action === "CHANGE PASSWORD"
                                        ? "Clic para reiniciar la contraseña de este usuario"
                                        : "Clic para marcar como leída"
                                }
                                className="
                                    group flex items-start gap-4
                                    rounded-2xl border border-edge
                                    bg-surface-2 p-4 cursor-pointer
                                    transition-all duration-200
                                    hover:border-brand-500
                                    hover:bg-surface
                                    hover:shadow-md
                                "
                            >
                                <div className="mt-2 h-3 w-3 shrink-0 rounded-full bg-accent-strong" />

                                <div className="flex-1">
                                    <p className="font-semibold text-ink">
                                        {n.title}
                                    </p>

                                    <p className="mt-1 text-sm text-ink-dim">
                                        {n.message}
                                    </p>

                                    <p className="font-data mt-3 text-xs text-ink-dim/70">
                                        {new Date(
                                            n.created_at
                                        ).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end border-t border-edge bg-surface-2 px-5 py-4">
                    <button
                        onClick={onClose}
                        className="
                            rounded-xl border border-edge bg-surface px-5 py-2
                            text-sm font-medium text-ink
                            transition hover:bg-surface-2
                        "
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
}
