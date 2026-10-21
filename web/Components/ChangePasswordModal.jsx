"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { changePassword, recoveryPassword } from "../services/authService";
import { markAsRead } from "../services/userServiceAPI";

/**
 * @param {{
 *   show: boolean,
 *   onClose: () => void,
 *   isForcedChange?: boolean,
 *   userId?: string | null,
 *   notificationId?: string | null,
 * }} props
 */
export default function ChangePasswordModal({
  show,
  onClose,
  isForcedChange = false,
  userId = null,
  notificationId = null,
}) {
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const PASSWORD_REGEX =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#_-])[A-Za-z\d@$!%*?&.#_-]{8,}$/;

  const validatePasswordFields = () => {
    if (
      (!isForcedChange && !currentPassword) ||
      !newPassword ||
      !confirmPassword
    ) {
      setPasswordError("Todos los campos son obligatorios.");
      return false;
    }
    return true;
  };

  const validatePasswordFormat = () => {
    if (!PASSWORD_REGEX.test(newPassword)) {
      setPasswordError(
        "La contraseña debe contener al menos 8 caracteres, una letra mayúscula, una letra minúscula, un número y un carácter especial."
      );
      return false;
    }
    return true;
  };

  const validatePasswordsMatch = () => {
    if (newPassword !== confirmPassword) {
      setPasswordError("Las contraseñas no coinciden.");
      return false;
    }
    return true;
  };

  const handleChangePassword = async () => {
    setPasswordError("");

    if (!validatePasswordFields()) return;
    if (!validatePasswordFormat()) return;
    if (!validatePasswordsMatch()) return;

    setSavingPassword(true);

    let result;
    if (isForcedChange) {
      result = await recoveryPassword(newPassword, userId);
    } else {
      result = await changePassword(currentPassword, newPassword);
    }

    if (result.error) {
      setSavingPassword(false);
      setPasswordError(result.error);
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setSavingPassword(false);

    if (isForcedChange) {
      if (notificationId) {
        await markAsRead(notificationId);
      }
      onClose();
      window.location.reload();
    } else {
      router.replace("/Login");
    }
  };

  if (!show) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-brand-900/55 backdrop-blur-sm p-4">

      <div className="w-full max-w-[420px] rounded-2xl bg-surface shadow-2xl border border-edge overflow-hidden animate-in fade-in zoom-in-95">

        {/* HEADER */}
        <div className="border-b border-edge px-6 py-4">
          <span className="eyebrow text-brand-600">Seguridad</span>
          <h2 className="text-xl font-semibold text-ink -mt-0.5">
            Cambiar contraseña
          </h2>
          <p className="text-sm text-ink-dim mt-1">
            Actualiza tu contraseña para mantener tu cuenta segura
          </p>
        </div>

        {/* BODY */}
        <div className="p-6 space-y-4">
          <div className="rounded-lg bg-accent-soft border border-accent/25 p-3">
            <p className="text-xs text-brand-700 font-medium mb-1">
              Requisitos de la contraseña:
            </p>

            <ul className="text-xs text-brand-700/80 list-disc ml-4 space-y-1">
              <li>Mínimo 8 caracteres</li>
              <li>Al menos una letra mayúscula</li>
              <li>Al menos una letra minúscula</li>
              <li>Al menos un número</li>
              <li>Al menos un carácter especial (@$!%*?&.#_-)</li>
            </ul>
          </div>

          <div>
            {!isForcedChange && (
              <div className="relative">
                <label htmlFor="cp-current" className="sr-only">
                  Contraseña actual
                </label>
                <input
                  id="cp-current"
                  type={showCurrentPassword ? "text" : "password"}
                  placeholder="Contraseña actual"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-edge bg-surface-2 px-4 py-3 pr-12 text-sm text-ink outline-none focus:border-brand-600 focus:bg-surface focus:ring-2 focus:ring-brand-600/20 transition"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowCurrentPassword(!showCurrentPassword)
                  }
                  aria-label={showCurrentPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  title={showCurrentPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-dim hover:text-ink transition"
                >
                  {showCurrentPassword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
              </div>
            )}
          </div>

          <div>
            <div className="relative">
              <label htmlFor="cp-new" className="sr-only">
                Nueva contraseña
              </label>
              <input
                id="cp-new"
                type={showNewPassword ? "text" : "password"}
                placeholder="Nueva contraseña"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                className="w-full rounded-xl border border-edge bg-surface-2 px-4 py-3 pr-12 text-sm text-ink outline-none focus:border-brand-600 focus:bg-surface focus:ring-2 focus:ring-brand-600/20 transition"
              />

              <button
                type="button"
                onClick={() =>
                  setShowNewPassword(!showNewPassword)
                }
                aria-label={showNewPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                title={showNewPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-dim hover:text-ink transition"
              >
                {showNewPassword ? (
                  <EyeOff size={20} />
                ) : (
                  <Eye size={20} />
                )}
              </button>
            </div>
          </div>

          <div>
            <div className="relative">
              <label htmlFor="cp-confirm" className="sr-only">
                Confirmar contraseña
              </label>
              <input
                id="cp-confirm"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirmar contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                className="w-full rounded-xl border border-edge bg-surface-2 px-4 py-3 pr-12 text-sm text-ink outline-none focus:border-brand-600 focus:bg-surface focus:ring-2 focus:ring-brand-600/20 transition"
              />

              <button
                type="button"
                onClick={() =>
                  setShowConfirmPassword(!showConfirmPassword)
                }
                aria-label={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                title={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-dim hover:text-ink transition"
              >
                {showConfirmPassword ? (
                  <EyeOff size={20} />
                ) : (
                  <Eye size={20} />
                )}
              </button>
            </div>
          </div>

          {passwordError && (
            <div className="rounded-lg bg-danger-soft border border-danger/20 px-3 py-2">
              <p className="text-sm text-danger">
                {passwordError}
              </p>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="flex items-center justify-end gap-3 border-t border-edge px-6 py-4 bg-surface-2">

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-ink-dim hover:bg-surface transition"
          >
            Cancelar
          </button>

          <button
            onClick={handleChangePassword}
            disabled={savingPassword}
            className="px-5 py-2 rounded-xl bg-brand-700 text-white text-sm font-medium shadow-sm hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {savingPassword ? "Guardando..." : "Guardar"}
          </button>

        </div>

      </div>
    </div>
  );
}