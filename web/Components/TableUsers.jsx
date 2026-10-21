"use client";

import { useEffect, useState } from "react";
import { getUsuarios, toggleUsuario, createNotification } from "../services/userServiceAPI";
import ModalEditUser from "./ModalEditUser";
import {showSuccess,showError} from "../utils/alerts";
import { usePermissions } from "../Context/PermissionContext";
import Pager from "./Pager";
import { useRealtimeRefresh } from "../hooks/useRealtimeRefresh";

const PAGE_SIZE = 25;

export default function TableUsuarios({ refreshTable, search, roleFilter, statusFilter }) {
    const [usuarios, setUsuarios] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const { getScreenId } = usePermissions();

    const fetchUsuarios = async () => {
        setLoading(true);
        try {
            const data = await getUsuarios({ search, role: roleFilter, status: statusFilter, page, pageSize: PAGE_SIZE });
            setUsuarios(data.items);
            setTotalCount(data.totalCount);
        } catch {
            showError("No fue posible cargar los usuarios.");
        } finally {
            setLoading(false);
        }
    };

    // Un usuario nunca se elimina, solo se activa o inactiva
    const toggleActivo = async (id, status, name) => {
    try {
        const data = await toggleUsuario(id, status);
        if(data.message === "No se puede inactivar el mismo usuario de la sesion") {
                showError("No se puede inactivar el mismo usuario de la sesión.");
                return;
            }
        await fetchUsuarios();

        await createNotification(
            status ? "Usuario Activado" : "Usuario Inactivado",
            `Se ha ${status ? "activado" : "inactivado"} el usuario ${name}.`,
            getScreenId("Users")
        );

        window.dispatchEvent(
            new Event("notification-created")
        );

        showSuccess(
            `El usuario fue ${status ? "activado" : "inactivado"} correctamente.`
        );

    } catch {

        showError(
            `No fue posible ${status ? "activar" : "inactivar"} el usuario.`
        );
    }
};

    // cualquier cambio de filtro vuelve a la primera pagina
    useEffect(() => {
        setPage(1);
    }, [search, roleFilter, statusFilter]);

    useEffect(() => {
        fetchUsuarios();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [refreshTable, search, roleFilter, statusFilter, page]);

    useRealtimeRefresh("users", fetchUsuarios);

    return (
        <div className="overflow-x-auto rounded-2xl border border-edge bg-surface shadow-sm">
            <table className="w-full text-ink">
                <thead className="bg-surface-2">
                    <tr className="text-left text-xs font-semibold uppercase tracking-wide text-ink-dim">
                        <th className="px-6 py-3.5 font-data font-semibold">ID</th>
                        <th className="px-6 py-3.5">Nombre</th>
                        <th className="px-6 py-3.5">Email</th>
                        <th className="px-6 py-3.5">Rol</th>
                        <th className="px-6 py-3.5">Estado</th>
                        <th className="px-6 py-3.5">Acciones</th>
                    </tr>
                </thead>

                <tbody>
                    {loading ? (
                        <tr>
                            <td colSpan={6} className="py-10 text-center text-ink-dim">
                                Cargando usuarios...
                            </td>
                        </tr>
                    ) : usuarios.length > 0 ? (
                    usuarios.map((u) => (
                        <tr
                            key={u.publicId}
                            className="border-t border-edge transition hover:bg-surface-2/60"
                        >

                            {/* ID */}
                            <td className="px-6 py-4 font-data text-sm text-ink-dim">
                                {u.id}
                            </td>

                            {/* Nombre */}
                            <td className="px-6 py-4 font-medium">
                                {u.name}
                            </td>

                            {/* Correo */}
                            <td className="px-6 py-4 text-ink-dim">
                                {u.email}
                            </td>

                            {/* Rol */}
                            <td className="px-6 py-4">
                                <span className="rounded-full bg-brand-50 px-3 py-1 text-sm text-brand-700">
                                    {u.role}
                                </span>
                            </td>

                            {/* Estado */}
                            <td className="px-6 py-4">
                                <button
                                    onClick={() => toggleActivo(u.publicId, !u.is_active, u.name)}
                                    title={u.is_active ? `Desactivar a ${u.name}` : `Activar a ${u.name}`}
                                    className={`
                                        inline-flex items-center gap-1.5
                                        px-3.5
                                        py-1.5
                                        rounded-full
                                        text-sm
                                        font-medium
                                        transition
                                        ${u.is_active
                                            ? "bg-accent-soft text-brand-700 hover:brightness-95"
                                            : "bg-danger-soft text-danger hover:brightness-95"
                                        }
                                    `}
                                >
                                    <span className={`h-1.5 w-1.5 rounded-full ${u.is_active ? "bg-accent-strong" : "bg-danger"}`} />
                                    {u.is_active
                                        ? "Activo"
                                        : "Inactivo"}
                                </button>
                            </td>

                            {/* Acciones */}
                            <td className="px-6 py-4">
                                <div className="flex gap-2">

                                    <button
                                        onClick={() => {
                                            setSelectedUser(u);
                                            setShowEditModal(true);
                                        }}
                                        title={`Editar a ${u.name}`}
                                        className="
                                            rounded-lg
                                            border border-edge
                                            px-3.5
                                            py-1.5
                                            text-sm
                                            text-ink
                                            transition
                                            hover:bg-surface-2
                                        "
                                    >
                                        Editar
                                    </button>

                                </div>
                            </td>

                        </tr>
                    ))
                    ) : (
                        <tr>
                            <td colSpan={6} className="py-10 text-center text-ink-dim">
                                No hay usuarios registrados.
                            </td>
                        </tr>
                    )}
                </tbody>

            </table>

            <Pager page={page} pageSize={PAGE_SIZE} totalCount={totalCount} onPageChange={setPage} />

            <ModalEditUser
                showModal={showEditModal}
                setShowModal={setShowEditModal}
                user={selectedUser}
                onSave={fetchUsuarios}
            />
        </div>
    );
}
