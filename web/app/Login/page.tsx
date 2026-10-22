"use client";

import { useState } from "react";
import Image from "next/image";
import { Eye, EyeOff, Leaf, Recycle, BarChart3 } from "lucide-react";
import { loginUser, changePassword, requestPasswordRecovery } from "../../services/authService";

export default function Login() {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // estados del modal de cambio de contraseña
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // estados del modal de recuperar contraseña
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryId, setRecoveryId] = useState("");
  const [recoverySending, setRecoverySending] = useState(false);
  const [recoveryFeedback, setRecoveryFeedback] = useState("");
  const [recoveryError, setRecoveryError] = useState("");


  const handleChangePassword = async () => {
    setPasswordError("");

    if (!newPassword || !confirmPassword) {
      setPasswordError("Todos los campos son obligatorios.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Las contraseñas no coinciden.");
      return;
    }

    setSavingPassword(true);

    const result = await changePassword(password, newPassword);

    setSavingPassword(false);

    if (result.error) {
      setPasswordError(result.error);
      return;
    }

    sessionStorage.removeItem("mustChangePassword");
    setShowChangePassword(false);
    window.location.href = "/MainSystemPage";
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const data = await loginUser(name, password);
    setLoading(false);

    if (data.error) {
      setError(data.error);
      return;
    }

    if (data.mustChange) {
      sessionStorage.setItem("mustChangePassword", data.mustChange.toString());
      setShowChangePassword(true);
      return;
    }

    window.location.href = "/MainSystemPage";
  };

  const handleRequestRecovery = async () => {
    if (!recoveryId) return;

    setRecoveryError("");
    setRecoverySending(true);

    const result = await requestPasswordRecovery(recoveryId);

    setRecoverySending(false);

    if (result.error) {
      setRecoveryError(result.error);
      return;
    }

    setRecoveryFeedback(
      "Si la identificación existe, se notificó al equipo administrador."
    );
  };

  const closeRecoveryModal = () => {
    setShowRecovery(false);
    setRecoveryId("");
    setRecoveryFeedback("");
    setRecoveryError("");
  };


  return (
    <div className="min-h-screen grid md:grid-cols-[1.1fr_1fr] bg-surface">

      {showChangePassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-900/55 backdrop-blur-sm p-4">
          <div className="bg-surface w-full max-w-[440px] rounded-2xl shadow-2xl border border-edge p-7">
            <span className="eyebrow text-accent-strong">Seguridad de la cuenta</span>
            <h2 className="mt-2 text-2xl font-semibold text-ink">
              Cambio de contraseña requerido
            </h2>
            <p className="text-ink-dim text-sm mt-2 mb-6">
              Por seguridad, debes cambiar tu contraseña temporal antes de continuar.
            </p>

            {/* Nueva contraseña */}
            <div className="relative mb-4">
              <label htmlFor="new-password" className="sr-only">
                Nueva contraseña
              </label>
              <input
                id="new-password"
                type={showNewPassword ? "text" : "password"}
                placeholder="Nueva contraseña"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                className="w-full border border-edge rounded-xl px-4 py-3 pr-12 text-ink bg-surface-2 focus:outline-none focus:ring-2 focus:ring-accent-strong focus:border-accent-strong transition"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                aria-label={showNewPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-dim hover:text-ink transition"
              >
                {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {/* Confirmar contraseña */}
            <div className="relative mb-6">
              <label htmlFor="confirm-password" className="sr-only">
                Confirmar contraseña
              </label>
              <input
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirmar contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                className="w-full border border-edge rounded-xl px-4 py-3 pr-12 text-ink bg-surface-2 focus:outline-none focus:ring-2 focus:ring-accent-strong focus:border-accent-strong transition"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-dim hover:text-ink transition"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {/* Mensaje de error */}
            {passwordError && (
              <div className="mb-4 p-3 bg-danger-soft border border-danger/20 rounded-lg text-sm text-danger">
                {passwordError}
              </div>
            )}

            {/* Boton */}
            <button
              onClick={handleChangePassword}
              disabled={savingPassword}
              className="w-full bg-brand-700 hover:bg-brand-600 disabled:bg-ink-dim disabled:opacity-50 text-white font-semibold rounded-xl py-3 transition"
            >
              {savingPassword ? "Actualizando..." : "Actualizar contraseña"}
            </button>
          </div>
        </div>
      )}

      <div className="relative hidden md:flex flex-col justify-between overflow-hidden bg-brand-900 px-12 py-12 text-white">

        {/* patrón decorativo, orgánico + técnico */}
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.14]"
          viewBox="0 0 600 800"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="520" cy="90" r="220" stroke="var(--accent)" strokeWidth="1" />
          <circle cx="520" cy="90" r="150" stroke="var(--accent)" strokeWidth="1" />
          <circle cx="60" cy="760" r="180" stroke="var(--accent)" strokeWidth="1" />
          <path d="M0 420 C 150 380, 250 460, 400 400 S 650 340, 700 420" stroke="var(--accent)" strokeWidth="1" />
          <path d="M0 480 C 150 440, 250 520, 400 460 S 650 400, 700 480" stroke="var(--accent)" strokeWidth="1" />
        </svg>

        <div className="relative z-10 flex items-center gap-3">
          <Image src="/Images/logo.webp" alt="EcoWay" width={38} height={38} priority />
          <span className="text-lg font-semibold tracking-tight">EcoWay</span>
        </div>

        <div className="relative z-10 max-w-sm">
          <span className="eyebrow text-accent">Plataforma de gestión de materiales</span>
          <h1 className="mt-4 text-[34px] leading-[1.15] font-semibold text-balance">
            Trazabilidad del reciclaje, de punta a punta.
          </h1>
          <p className="mt-4 text-white/70 text-[15px] leading-relaxed">
            Un solo lugar para administrar usuarios, materiales y el flujo completo
            de tu operación de recuperación de materiales.
          </p>

          <div className="mt-10 grid grid-cols-3 gap-4 font-data text-sm">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <Recycle size={18} className="text-accent mb-3" />
              <div className="text-white/60 text-xs">Materiales</div>
              <div className="text-white text-lg">activos</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <BarChart3 size={18} className="text-accent mb-3" />
              <div className="text-white/60 text-xs">Control</div>
              <div className="text-white text-lg">en vivo</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <Leaf size={18} className="text-accent mb-3" />
              <div className="text-white/60 text-xs">Impacto</div>
              <div className="text-white text-lg">medible</div>
            </div>
          </div>
        </div>

        <p className="relative z-10 text-xs text-white/40">
          © 2026 DaeByte. All rights reserved.
        </p>
      </div>

      <div className="flex items-center justify-center p-6 md:p-12 bg-background">
        <form onSubmit={handleLogin} className="w-full max-w-[400px]">

          {/* se ve solo en mobile, el panel izquierdo se oculta */}
          <div className="flex flex-col items-center md:items-start mb-9">
            <Image
              src="/Images/logo.webp"
              alt="Logo"
              width={44}
              height={44}
              priority
              className="md:hidden mb-4"
            />
            <span className="eyebrow text-brand-600">Inicio de sesión</span>
            <h1 className="text-[26px] font-semibold text-ink mt-2">Bienvenido de vuelta</h1>
            <p className="text-ink-dim text-sm mt-1">Ingresá con tu identificación y contraseña.</p>
          </div>

          {/* Alerta de error */}
          {error && (
            <div className="mb-6 p-3 bg-danger-soft border border-danger/20 rounded-lg text-sm text-danger">
              {error}
            </div>
          )}

          {/* Campos */}
          <div className="space-y-4 mb-6">

            {/* Usuario */}
            <div>
              <label htmlFor="login-id" className="sr-only">
                Usuario
              </label>
              <input
                id="login-id"
                type="text"
                placeholder="Usuario"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="username"
                className="w-full border border-edge rounded-xl px-4 py-3 text-ink placeholder-ink-dim/60 bg-surface focus:outline-none focus:border-accent-strong focus:ring-2 focus:ring-accent-strong/40 transition"
              />
            </div>

            {/* Contraseña */}
            <div>
              <label htmlFor="login-password" className="sr-only">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full border border-edge rounded-xl px-4 py-3 pr-12 text-ink placeholder-ink-dim/60 bg-surface focus:outline-none focus:border-accent-strong focus:ring-2 focus:ring-accent-strong/40 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-dim hover:text-ink transition"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Boton */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-xl text-white font-semibold transition shadow-[0_8px_24px_-8px_hsl(var(--shadow-color)/0.45)] ${
                loading
                  ? "bg-ink-dim cursor-not-allowed shadow-none"
                  : "bg-brand-700 hover:bg-brand-600"
              }`}
            >
              {loading ? "Cargando..." : "Iniciar sesión"}
            </button>
          </div>

          {/* Olvide mi contraseña */}
          <button
            type="button"
            onClick={() => setShowRecovery(true)}
            className="w-full text-sm text-brand-600 hover:text-brand-700 hover:underline transition"
          >
            ¿Olvidó su contraseña?
          </button>
        </form>
      </div>

      {showRecovery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-900/55 backdrop-blur-sm p-4">
          <div className="bg-surface p-7 rounded-2xl shadow-2xl border border-edge w-full max-w-[400px]">
            <h2 className="text-xl font-semibold text-ink mb-1">
              Recuperar contraseña
            </h2>

            {!recoveryFeedback && (
              <p className="text-sm text-ink-dim mb-5">
                Escribí tu usuario y le avisamos al equipo administrador para que revise tu solicitud.
              </p>
            )}

            {recoveryFeedback ? (
              <div className="mb-5 p-3 bg-brand-50 border border-brand-100 rounded-lg text-sm text-brand-700">
                {recoveryFeedback}
              </div>
            ) : (
              <>
                <label htmlFor="recovery-id" className="sr-only">
                  Usuario
                </label>
                <input
                  id="recovery-id"
                  type="text"
                  placeholder="Usuario"
                  value={recoveryId}
                  onChange={(e) => setRecoveryId(e.target.value)}
                  className="w-full border border-edge rounded-xl px-4 py-3 mb-4 text-ink bg-surface-2 placeholder-ink-dim/60 focus:outline-none focus:ring-2 focus:ring-accent-strong transition"
                />

                {recoveryError && (
                  <div className="mb-4 p-3 bg-danger-soft border border-danger/20 rounded-lg text-sm text-danger">
                    {recoveryError}
                  </div>
                )}
              </>
            )}

            {/* Botones */}
            <div className="flex gap-3">
              {/* Cancelar */}
              <button
                type="button"
                onClick={closeRecoveryModal}
                className="flex-1 bg-surface-2 hover:bg-edge text-ink font-semibold py-2.5 rounded-xl transition"
              >
                {recoveryFeedback ? "Cerrar" : "Cancelar"}
              </button>

              {/* Boton */}
              {!recoveryFeedback && (
                <button
                  onClick={handleRequestRecovery}
                  disabled={recoverySending}
                  className="flex-1 bg-brand-700 hover:bg-brand-600 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition"
                >
                  {recoverySending ? "Enviando..." : "Solicitar recuperación"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
