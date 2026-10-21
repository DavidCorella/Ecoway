"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Users, LogOut, Menu, X, Bell, Package, ShieldAlert, FileText, FileOutput, Receipt, Award, BarChart3, Building2, ListChecks } from "lucide-react";
import ModalNotification from "../../Components/NotificationModel";
import UsuariosCRUD from "./UsuariosCRUD";
import TableMaterials from "./MaterialsCRUD"
import LogsView from "./LogsView";
import CompaniesCRUD from "./CompaniesCRUD";
import TicketsCRUD from "./TicketsCRUD";
import TicketsManagementView from "./TicketsManagementView";
import ExitTicketsCRUD from "./ExitTicketsCRUD";
import ExitTicketsManagementView from "./ExitTicketsManagementView";
import QuotationsCRUD from "./QuotationsCRUD";
import CertificatesCRUD from "./CertificatesCRUD";
import CollectionSummariesCRUD from "./CollectionSummariesCRUD";
import { logoutUser, getStatus } from "../../services/authService";
import { usePermissions } from "../../Context/PermissionContext";
import ChangePasword from "../../Components/ChangePasswordModal";
import Profileinfo from "../../Components/ProfileInfo";
import { getNotifications, getProfile, NotificationItem, UserProfile } from "../../services/userServiceAPI";
import { useRealtimeRefresh } from "../../hooks/useRealtimeRefresh";

const NAV_ITEMS = [
  { key: "usuarios", label: "Usuarios", screen: "Users", icon: Users, accent: "accent" as const },
  { key: "materiales", label: "Materiales", screen: "Materials", icon: Package, accent: "materials" as const },
  { key: "empresas", label: "Empresas", screen: "Companies", icon: Building2, accent: "accent" as const },
  { key: "tickets", label: "Actas de Entrada", screen: "Tickets", icon: FileText, accent: "entrada" as const },
  { key: "gestionActas", label: "Inventario de Actas de Entrada", screen: "TicketsManagement", icon: ListChecks, accent: "entrada" as const },
  { key: "actasSalida", label: "Actas de Salida", screen: "ExitTickets", icon: FileOutput, accent: "salida" as const },
  { key: "gestionActasSalida", label: "Inventario de Actas de Salida", screen: "ExitTicketsManagement", icon: ListChecks, accent: "salida" as const },
  { key: "cotizaciones", label: "Cotizaciones", screen: "Quotations", icon: Receipt, accent: "quotes" as const },
  { key: "certificados", label: "Certificados", screen: "Certificates", icon: Award, accent: "certs" as const },
  { key: "resumenes", label: "Resumen de Recolección", screen: "CollectionSummaries", icon: BarChart3, accent: "summary" as const },
  { key: "logs", label: "Logs", screen: "Logs", icon: ShieldAlert, accent: "logs" as const },
];

// Las clases van completas porque Tailwind las necesita ver tal cual en el codigo
const ACCENT_STYLES = {
  accent: { bar: "bg-accent", icon: "text-accent" },
  materials: { bar: "bg-materials", icon: "text-materials" },
  logs: { bar: "bg-logs", icon: "text-logs" },
  entrada: { bar: "bg-entrada", icon: "text-entrada" },
  salida: { bar: "bg-salida", icon: "text-salida" },
  quotes: { bar: "bg-quotes", icon: "text-quotes" },
  certs: { bar: "bg-certs", icon: "text-certs" },
  summary: { bar: "bg-summary", icon: "text-summary" },
};

export default function MainSystem() {
  const router = useRouter();
  const { hasPermission, reloadPermissions, permissions, loading: permissionsLoading } = usePermissions();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  const [view, setView] = useState("usuarios");
  const [authorized, setAuthorized] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mustChange, setMustChange] = useState(false);

  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);
  const [NotificacionCount, setNotificationCount] = useState<number | null>(null);

  const fetchNotificationCount = async () => {
    try {
      const data = await getNotifications();
      setNotificationCount(data.length);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchUser = async () => {
    try {
      const data = await getProfile();
      setUser(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    const value = sessionStorage.getItem("mustChangePassword") === "true";
    setMustChange(value);

    const checkAuth = async () => {
      try {
        const res = await getStatus();
        if (res.status === 401) {
          // Hay que llamar logoutUser primero para que el backend borre la
          // cookie, si no middleware.ts la sigue viendo y rebota de vuelta
          await logoutUser();
          // Navegacion dura en vez de router.replace, para que no se quede
          // pegado con el router de Next
          window.location.href = "/Login";
        } else {
          setAuthorized(true);
          await reloadPermissions();
        }
      } catch {
        await logoutUser();
        window.location.href = "/Login";
      }
    };

    checkAuth();
    fetchNotificationCount();
    fetchUser();

    const increaseNotification = () => setNotificationCount((prev) => (prev ?? 0) + 1);
    const decreaseNotification = () => setNotificationCount((prev) => Math.max((prev ?? 0) - 1, 0));

    window.addEventListener("notification-created", increaseNotification);
    window.addEventListener("notification-read", decreaseNotification);

    return () => {
      window.removeEventListener("notification-created", increaseNotification);
      window.removeEventListener("notification-read", decreaseNotification);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  // Si otra PC (u otro usuario) genera una notificacion nueva, el
  // contador de la campanita se actualiza solo, sin esperar a que se
  // recargue la pagina
  useRealtimeRefresh("notifications", fetchNotificationCount);

  const allowedNavItems = NAV_ITEMS.filter((item) => hasPermission(item.screen));

  // "usuarios" es el view inicial a ciegas (los permisos todavia no
  // cargaron). Una vez que cargan, si el usuario no tiene acceso a esa
  // pantalla (o a ninguna), hay que movernos a la primera que si tenga,
  // si no se queda pegado en un titulo/pantalla a la que no tiene acceso
  // y el contenido sale en blanco
  useEffect(() => {
    if (permissionsLoading) return;
    if (allowedNavItems.some((item) => item.key === view)) return;
    setView(allowedNavItems[0]?.key ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permissionsLoading, permissions]);

  if (!authorized) return null;

  if (!mustChange) {
    return (
      <div className="flex min-h-screen bg-background">
        {/* BOTON MOBILE */}
        <button
          onClick={() => setMenuOpen(true)}
          className="fixed left-4 top-4 z-50 rounded-xl border border-edge bg-surface p-2 shadow-sm md:hidden"
          aria-label="Abrir menú"
          title="Abrir menú"
        >
          <Menu size={20} className="text-ink" />
        </button>

        {/* SIDEBAR */}
        <aside
          className={`fixed left-0 top-0 z-50 flex h-screen w-[260px] flex-col bg-brand-900 text-white transition-transform duration-300 md:translate-x-0 ${
            menuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* HEADER */}
          <div className="flex h-[76px] items-center gap-3 border-b border-white/10 px-6">
            <Image src="/Images/logo.webp" alt="EcoWay" width={34} height={34} className="object-contain" />
            <span className="text-[17px] font-semibold tracking-tight">EcoWay</span>

            <div className="ml-auto flex items-center gap-1.5">
              {/* NOTIFICACIONES */}
              <button
                onClick={() => setShowNotifications(true)}
                className="relative flex h-9 w-9 items-center justify-center rounded-lg text-white/70 transition hover:bg-white/10 hover:text-white"
                aria-label="Notificaciones"
                title="Notificaciones"
              >
                <Bell size={17} />
                {!!NotificacionCount && (
                  <span className="font-data absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-brand-950">
                    {NotificacionCount}
                  </span>
                )}
              </button>

              {/* CERRAR MOBILE */}
              <button onClick={() => setMenuOpen(false)} className="md:hidden text-white/70 hover:text-white" aria-label="Cerrar menú">
                <X size={20} />
              </button>
            </div>
          </div>

          {/* MENU */}
          <nav className="mt-6 flex flex-col gap-1 px-3">
            <span className="eyebrow px-3 mb-2 text-white/35">Operación</span>

            {NAV_ITEMS.filter((item) => hasPermission(item.screen)).map((item) => {
              const Icon = item.icon;
              const active = view === item.key;
              const styles = ACCENT_STYLES[item.accent];
              return (
                <button
                  key={item.key}
                  onClick={() => {
                    setView(item.key);
                    setMenuOpen(false);
                  }}
                  className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[14.5px] transition-colors ${
                    active
                      ? "bg-white/10 text-white font-medium"
                      : "text-white/65 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span
                    className={`absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full ${styles.bar} transition-opacity ${
                      active ? "opacity-100" : "opacity-0"
                    }`}
                  />
                  <Icon size={18} className={active ? styles.icon : "text-white/45 group-hover:text-white/70"} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* PERFIL */}
          <div className="mt-auto px-3 pb-3">
            <button
              onClick={() => setShowProfile(true)}
              className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-left transition hover:bg-white/10"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-brand-950 font-semibold">
                {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] font-medium text-white">{user?.name}</p>
                <p className="truncate text-xs text-white/50">{user?.position}</p>
              </div>
            </button>

            <button
              onClick={async () => {
                await logoutUser();
                // navegacion dura, misma razon que en checkAuth
                window.location.href = "/";
              }}
              className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[14.5px] text-white/55 transition hover:bg-white/5 hover:text-white"
            >
              <LogOut size={18} />
              Salir
            </button>
          </div>
        </aside>

        {/* OVERLAY MOBILE */}
        {menuOpen && <div className="fixed inset-0 z-40 bg-brand-900/50 md:hidden" onClick={() => setMenuOpen(false)} />}

        <ModalNotification
          show={showNotifications}
          onClose={async () => {
            setShowNotifications(false);
            fetchNotificationCount();
          }}
          onPasswordNotification={(notification: NotificationItem) => {
            setSelectedNotification(notification);
            setShowChangePassword(true);
          }}
        />

        <ChangePasword
          show={showChangePassword}
          onClose={() => {
            setShowChangePassword(false);
            fetchNotificationCount();
          }}
          isForcedChange={selectedNotification?.action === "CHANGE PASSWORD"}
          userId={selectedNotification?.reference}
          notificationId={selectedNotification?.id}
        />

        {showProfile && (
          <Profileinfo
            user={user}
            onClose={() => setShowProfile(false)}
            onChangePassword={() => {
              setShowChangePassword(true);
              setShowProfile(false);
            }}
          />
        )}

        {/* CONTENIDO */}
        <div className="flex flex-1 flex-col md:ml-[260px]">
          <main className="flex-1 p-6 pt-20 md:p-8">
            {(() => {
              const activeItem = allowedNavItems.find((item) => item.key === view);
              if (!activeItem) return null;
              const styles = ACCENT_STYLES[activeItem.accent];
              return (
                <div className="mb-6 flex items-center gap-3">
                  <span className={`h-6 w-1.5 rounded-full ${styles.bar}`} />
                  <h1 className="text-2xl font-semibold text-ink">{activeItem.label}</h1>
                </div>
              );
            })()}

            {!permissionsLoading && allowedNavItems.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-edge bg-surface px-6 py-16 text-center">
                <ShieldAlert size={28} className="text-ink-dim" />
                <p className="text-[15px] font-medium text-ink">No tenés acceso a ninguna pantalla</p>
                <p className="max-w-sm text-sm text-ink-dim">
                  Tu usuario todavía no tiene permisos asignados. Contactá a un administrador para que te habilite el acceso.
                </p>
              </div>
            )}

            {view === "usuarios" && hasPermission("Users") && <UsuariosCRUD />}
            {view === "materiales" && hasPermission("Materials") && <TableMaterials />}
            {view === "empresas" && hasPermission("Companies") && <CompaniesCRUD />}
            {view === "tickets" && hasPermission("Tickets") && <TicketsCRUD />}
            {view === "gestionActas" && hasPermission("TicketsManagement") && <TicketsManagementView />}
            {view === "cotizaciones" && hasPermission("Quotations") && <QuotationsCRUD />}
            {view === "certificados" && hasPermission("Certificates") && <CertificatesCRUD />}
            {view === "resumenes" && hasPermission("CollectionSummaries") && <CollectionSummariesCRUD />}
            {view === "actasSalida" && hasPermission("ExitTickets") && <ExitTicketsCRUD />}
            {view === "gestionActasSalida" && hasPermission("ExitTicketsManagement") && <ExitTicketsManagementView />}
            {view === "logs" && hasPermission("Logs") && <LogsView />}
          </main>
        </div>
      </div>
    );
  }

  logoutUser().then(() => {
    window.location.href = "/";
  });
}
