"use client";

export default function Profileinfo({ user, onClose, onChangePassword }) {

  if (!user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-900/55 backdrop-blur-sm p-4">

  <div className="w-full max-w-md rounded-2xl border border-edge bg-surface shadow-2xl overflow-hidden">

    {/* HEADER */}
    <div className="px-6 py-5 border-b border-edge">
      <span className="eyebrow text-brand-600">Mi cuenta</span>
      <h2 className="text-xl font-semibold text-ink -mt-0.5">
        Mi perfil
      </h2>
      <p className="text-sm text-ink-dim mt-1">
        Información de tu cuenta
      </p>
    </div>

    {/* CONTENT */}
    <div className="p-6 space-y-5">

      {/* ID */}
      <div>
        <label htmlFor="profile-id" className="text-xs font-medium text-ink-dim uppercase tracking-wide">
          ID
        </label>
        <input
          id="profile-id"
          value={user.id || ""}
          disabled
          className="mt-1 w-full rounded-xl border border-edge bg-surface-2 px-3 py-2 text-ink font-data"
        />
      </div>

      {/* NAME */}
      <div>
        <label htmlFor="profile-name" className="text-xs font-medium text-ink-dim uppercase tracking-wide">
          Nombre
        </label>
        <input
          id="profile-name"
          value={user.name || ""}
          disabled
          className="mt-1 w-full rounded-xl border border-edge bg-surface-2 px-3 py-2 text-ink"
        />
      </div>

      {/* PUESTO */}
      <div>
        <label htmlFor="profile-position" className="text-xs font-medium text-ink-dim uppercase tracking-wide">
          Puesto
        </label>
        <input
          id="profile-position"
          value={user.position || ""}
          disabled
          className="mt-1 w-full rounded-xl border border-edge bg-surface-2 px-3 py-2 text-ink"
        />
      </div>

      {/* BUTTON PRIMARY */}
      <button
        onClick={onChangePassword}
        className="w-full rounded-xl bg-brand-700 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-brand-600 active:scale-[0.98]"
      >
        Cambiar contraseña
      </button>
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
