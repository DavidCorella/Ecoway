"use client";

import { useState, useEffect } from "react";

import TableUsuarios from "../../Components/TableUsers";
import ModalCreateUser from "../../Components/ModalCreateUser";
import ModalRoles from "../../Components/ModalRoles";
import { getRoles } from "../../services/userService";

export default function UsuariosCRUD() {
  const [refreshTable, setRefreshTable] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [roles, setRoles] = useState([]);

  // el texto se manda al servidor con un pequeño retraso, para no pedir
  // una pagina nueva en cada tecla que se escribe
  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const fetchRoles = async () => {
    try {
      const data = await getRoles();
      setRoles(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchRoles();
    if (!showModal) {
      setRefreshTable((prev) => prev + 1);
    }
    // También se vuelve a pedir cuando se cierra el modal de Roles y
    // permisos, para que un rol nuevo (o renombrado) aparezca de una
    // vez en el filtro "Todos los roles" sin recargar la página
  }, [showModal, showRoleModal]);



  return (
    <div className="w-full">
      {/* ACCIONES */}
      <div className="flex flex-wrap items-center justify-end gap-4 mb-6">
        <div className="flex gap-3">
          <button
            onClick={() => {
              setShowRoleModal(true);
            }}
            className="rounded-xl border border-edge bg-surface px-4 py-2.5 text-sm font-medium text-ink transition hover:bg-surface-2"
          >
            Roles y permisos
          </button>

          <button
            onClick={() => setShowModal(true)}
            className="rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-600"
          >
            + Agregar usuario
          </button>
        </div>

      </div>
      <div className="mb-5 flex flex-wrap gap-3 rounded-2xl border border-edge bg-surface p-3">

        {/* Buscador */}
        <input
          type="text"
          placeholder="Buscar usuario..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="flex-1 min-w-[220px] rounded-xl border border-edge bg-surface-2 px-4 py-2 text-ink placeholder-ink-dim/60 focus:outline-none focus:ring-2 focus:ring-accent-strong/40 focus:border-accent-strong transition"
        />

        {/* Rol */}
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-xl border border-edge bg-surface-2 px-4 py-2 text-ink focus:outline-none focus:ring-2 focus:ring-accent-strong/40 transition"
        >
          <option value="">Todos los roles</option>

          {roles.map((roles) => (
            <option
              key={roles.id}
              value={roles.name}
            >
              {roles.name}
            </option>
          ))}
        </select>

        {/* Estado */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-edge bg-surface-2 px-4 py-2 text-ink focus:outline-none focus:ring-2 focus:ring-accent-strong/40 transition"
        >
          <option value="">Todos los estados</option>
          <option value="Activo">Activo</option>
          <option value="Inactivo">Inactivo</option>
        </select>

        {/* Limpiar */}
        <button
          onClick={() => {
            setSearchInput("");
            setSearch("");
            setRoleFilter("");
            setStatusFilter("");
          }}
          className="rounded-xl px-4 py-2 text-sm font-medium text-ink-dim transition hover:bg-surface-2 hover:text-ink"
        >
          Limpiar
        </button>

      </div>
      <TableUsuarios
        refreshTable={refreshTable}
        search={search}
        roleFilter={roleFilter}
        statusFilter={statusFilter}
      />
      {/* MODAL PERMISOS */}
      <ModalRoles
        showRoleModal={showRoleModal}
        setShowRoleModal={setShowRoleModal}
      />

      {/* MODAL USUARIO */}

      <ModalCreateUser
        showModal={showModal}
        setShowModal={setShowModal} />

    </div>
  );
}