"use client";

import {
  getRoles,
  getScreens,
  saveRolePermissions,
  getPermision,
  createRole,
  deleterole,
} from "../services/userService";
import { createNotification } from "../services/userServiceAPI";
import { useState, useEffect } from "react";
import { usePermissions } from "../Context/PermissionContext";
import { useRealtimeRefresh } from "../hooks/useRealtimeRefresh";
import {showSuccess,showError} from "../utils/alerts";

// El backend a veces manda un error propio con { message }, pero un 400
// de validacion automatica de .NET viene como { title, errors } sin
// "message", por eso hay que revisar los dos campos antes de mostrar
// el error
function extractErrorMessage(error, fallback) {
  try {
    const parsed = JSON.parse(error.message);
    return parsed?.message || parsed?.title || fallback;
  } catch {
    return error.message || fallback;
  }
}

// Las pantallas se guardan en la base con su nombre en ingles, aca se traduce solo para mostrar
const SCREEN_LABELS = {
  Users: "Usuarios",
  Materials: "Materiales",
  Tickets: "Boletas de Recolecta",
  TicketsManagement: "Inventario de Actas de Entrada",
  ExitTickets: "Actas de Salida",
  ExitTicketsManagement: "Inventario de Actas de Salida",
  Quotations: "Cotizaciones",
  Certificates: "Certificados",
  CollectionSummaries: "Resumen de Recolección",
  Companies: "Empresas",
};

export default function ModalCreateUser({ showRoleModal, setShowRoleModal }) {
  const [roles, setRoles] = useState([]);
  const [screens, setScreens] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [newRole, setNewRole] = useState("");
  const [roleError, setRoleError] = useState("");
  const { getScreenId} = usePermissions();
  const fetchRoles = async () => {
    try {
      const data = await getRoles();
      setRoles(data);
    } catch {

    }
  };
  const loadPermissions = async () => {
    try {
      const rolesData = await getRoles();
      const screensData = await getScreens();

      setRoles(rolesData);
      setScreens(screensData);

      const defaultRole = rolesData[0];
      setSelectedRole(defaultRole);

      await buildPermissions(defaultRole, screensData);
    } catch {

    }
  };

  const buildPermissions = async (role, screensData = screens) => {
    if (!role) return;

    const matrix = await Promise.all(
      screensData.map(async (screen) => ({
        roleId: role.id,
        roleName: role.name,
        screenId: screen.id,
        screenName: screen.name,
        // Si la pantalla todavia no tiene fila en Access para este rol,
        // getPermision devuelve null (no false). Se normaliza aca para no
        // mandar "active: null" al guardar, que el backend no puede
        // deserializar en un bool
        hasPermission: (await getPermision(role.id, screen.id)) ?? false,
      }))
    );

    setPermissions(matrix);
  };
  const handleRoleChange = async (roleId) => {
    const role = roles.find((item) => item.id === roleId);
    setSelectedRole(role);
    await buildPermissions(role);
  };
  const createRoles = async (roleName) => {
    try {
      const name = roleName.trim();
      setRoleError("");

      if (!name) {
        setRoleError("El nombre del rol es obligatorio");
        return;
      }

      if (name.length < 4) {
        setRoleError("El nombre del rol debe tener al menos 4 caracteres");
        return;
      }

      // El backend devuelve el rol recien creado (id + nombre), asi no hay
      // que adivinar cual es en la lista: SQL Server no garantiza el orden
      // de las filas sin un ORDER BY explicito
      const created = await createRole(name);
      await createNotification(
        "Rol Creado",
        `Se ha creado el rol ${name}.`,
         getScreenId("Users")
      );
      window.dispatchEvent(
        new Event("notification-created")
      );
      setNewRole("");
      setRoleError("");

      const rolesData = await getRoles();
      setRoles(rolesData);

      const newRoleData = rolesData.find((r) => r.id === created?.id) ?? rolesData[rolesData.length - 1];
      setSelectedRole(newRoleData);
      await buildPermissions(newRoleData, screens);

      showSuccess(`Rol ${name} creado exitosamente`);
    } catch (error) {
      showError(extractErrorMessage(error, "Error al crear el rol."));
    }
  };

  const deleteRoles = async (id, name) => {
    try {
      // deleterole puede responder 200 con "false" (ej. si el rol ya no
      // existe), sin este chequeo igual se mostraba "eliminado exitosamente"
      const deleted = await deleterole(id);
      if (!deleted) {
        showError(`No fue posible eliminar el rol ${name}.`);
        return;
      }

      fetchRoles();
      loadPermissions();
      await createNotification(
        "Rol Eliminado",
        `Se ha eliminado el rol ${name}.`,
         getScreenId("Users")
      );
      window.dispatchEvent(
        new Event("notification-created")
      );
      showSuccess(`Rol ${name} eliminado exitosamente`);
    } catch (error) {
      showError(extractErrorMessage(error, "Error al eliminar el rol."));
    }
  };

 const saveAllPermissions = async () => {
    try {

        const permissionsToSave = permissions.map(
            (permission) => ({
                role_id: permission.roleId,
                screen_id: permission.screenId,
                active: permission.hasPermission,
            })
        );

        await saveRolePermissions(
            permissionsToSave
        );

        await createNotification(
            "Permisos Actualizados",
            `Se actualizaron los permisos del rol ${selectedRole?.name ?? "seleccionado"}.`,
             getScreenId("Users")
        );

        window.dispatchEvent(
            new Event("notification-created")
        );

        setShowRoleModal(false);
        showSuccess(`Permisos del rol ${selectedRole?.name ?? "seleccionado"} actualizados exitosamente`);

    } catch (error) {
        showError(extractErrorMessage(error, "Error al actualizar los permisos."));
    }
};

  useEffect(() => {
    fetchRoles();
    loadPermissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Solo refresca la lista de roles del desplegable, no la matriz de
  // permisos que se este viendo — asi no se interrumpe una edicion en
  // curso si otra PC crea o borra un rol distinto al que se esta viendo
  useRealtimeRefresh("permissions", fetchRoles);

  return (
    <>
      {showRoleModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-brand-900/55 backdrop-blur-sm p-4">

          <div className="w-[700px] rounded-2xl bg-surface shadow-2xl border border-edge overflow-hidden animate-in fade-in zoom-in-95">

            {/* HEADER */}
            <div className="border-b border-edge px-6 py-4">
              <span className="eyebrow text-brand-600">Usuarios</span>
              <h2 className="text-xl font-semibold text-ink -mt-0.5">
                Roles y permisos
              </h2>

              <p className="text-sm text-ink-dim mt-1">
                Administre los permisos asociados a cada rol del sistema.
              </p>
            </div>

            {/* BODY */}
            <div className="p-6 border-b border-edge">

              {roleError && (
                <div className="mb-4 rounded-lg border border-danger/20 bg-danger-soft px-4 py-3">
                  <p className="text-sm text-danger">
                    {roleError}
                  </p>
                </div>
              )}

              {/* Crear Rol */}
              <div className="mb-5 flex gap-3">

                <label htmlFor="new-role-name" className="sr-only">Nombre del nuevo rol</label>
                <input
                  id="new-role-name"
                  type="text"
                  placeholder="Nombre del nuevo rol"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="
              flex-1
              rounded-xl
              border border-edge
              bg-surface-2
              px-4 py-3
              text-sm text-ink
              outline-none
              transition
              focus:border-brand-600
              focus:bg-surface
              focus:ring-2
              focus:ring-brand-600/25
            "
                />

                <button
                  onClick={() => createRoles(newRole)}
                  className="
              rounded-xl
              bg-brand-700
              px-5 py-3
              text-sm
              text-white
              font-medium
              shadow-sm
              transition
              hover:bg-brand-600
            "
                >
                  Crear
                </button>

              </div>

              {/* Selector */}
              <label htmlFor="role-select" className="sr-only">Rol</label>
              <select
                id="role-select"
                className="
            mb-5
            w-full
            rounded-xl
            border border-edge
            bg-surface-2
            px-4 py-3
            text-sm text-ink
            outline-none
            transition
            focus:border-brand-600
            focus:bg-surface
            focus:ring-2
            focus:ring-brand-600/25
          "
                value={selectedRole?.id || ""}
                onChange={(e) => handleRoleChange(e.target.value)}
              >
                {roles.map((r) => (
                  <option
                    key={r.id}
                    value={r.id}
                  >
                    {r.name}
                  </option>
                ))}
              </select>

              {/* Permisos */}
              <div className="max-h-[400px] space-y-3 overflow-y-auto">

                {permissions.map((p) => (
                  <div
                    key={p.screenId}
                    className="
                flex items-center justify-between
                rounded-xl
                border border-edge
                bg-surface-2
                px-4 py-3
                transition
                hover:bg-surface
                hover:shadow-sm
              "
                  >
                    <div>
                      <p className="font-medium text-ink">
                        {SCREEN_LABELS[p.screenName] ?? p.screenName}
                      </p>

                      <p className="text-xs text-ink-dim">
                        Permiso de acceso a la pantalla
                      </p>
                    </div>

                    <input
                      type="checkbox"
                      checked={p.hasPermission}
                      aria-label={`Permiso de ${p.roleName} sobre ${SCREEN_LABELS[p.screenName] ?? p.screenName}`}
                      title={`Permiso de ${p.roleName} sobre ${SCREEN_LABELS[p.screenName] ?? p.screenName}`}
                      onChange={() =>
                        setPermissions(prev =>
                          prev.map(item =>
                            item.screenId === p.screenId
                              ? {
                                ...item,
                                hasPermission: !item.hasPermission,
                              }
                              : item
                          )
                        )
                      }
                      className="h-5 w-5 cursor-pointer accent-brand-700"
                    />
                  </div>
                ))}

              </div>

            </div>

            {/* FOOTER */}
            <div className="flex items-center justify-between border-t border-edge bg-surface-2 px-6 py-4">

              <button
                onClick={() => selectedRole && deleteRoles(selectedRole.id, selectedRole.name)}
                className="rounded-xl border border-danger/20 bg-danger-soft px-5 py-2 text-sm font-medium text-danger transition hover:brightness-95"
              >
                Eliminar
              </button>

              <div className="flex gap-3">

                <button
                  onClick={() => setShowRoleModal(false)}
                  className="
              rounded-xl
              px-4 py-2
              text-sm
              text-ink-dim
              transition
              hover:bg-surface
            "
                >
                  Cancelar
                </button>

                <button
                  onClick={saveAllPermissions}
                  className="
              rounded-xl
              bg-brand-700
              px-5 py-2
              text-sm
              text-white
              font-medium
              shadow-sm
              transition
              hover:bg-brand-600
            "
                >
                  Guardar cambios
                </button>

              </div>

            </div>

          </div>

        </div>
      )}
    </>);
}
