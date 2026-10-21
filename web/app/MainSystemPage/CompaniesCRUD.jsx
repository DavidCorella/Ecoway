"use client";

import { useEffect, useState } from "react";
import { Pencil, Power, PowerOff } from "lucide-react";
import { getCompaniesPaged, updateCompanyStatus } from "../../services/TicketsService";
import { showError, showSuccess, showConfirm } from "../../utils/alerts";
import ModalCompany from "../../Components/ModalCompany";
import Pager from "../../Components/Pager";
import { useRealtimeRefresh } from "../../hooks/useRealtimeRefresh";

const PAGE_SIZE = 25;

export default function CompaniesCRUD() {
  const [companies, setCompanies] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);

  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const loadCompanies = async () => {
    setLoading(true);
    try {
      const data = await getCompaniesPaged({ search, status: statusFilter, page, pageSize: PAGE_SIZE });
      setCompanies(data.items);
      setTotalCount(data.totalCount);
    } catch {
      showError("No fue posible cargar las empresas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompanies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter, page]);

  // Si otra PC crea/edita/activa/inactiva una empresa, esta pantalla se
  // refresca sola (con los mismos filtros y pagina que ya estaban)
  useRealtimeRefresh("companies", loadCompanies);

  const openCreate = () => {
    setSelectedCompany(null);
    setShowModal(true);
  };

  const openEdit = (company) => {
    setSelectedCompany(company);
    setShowModal(true);
  };

  // Una empresa nunca se elimina, solo se activa o inactiva
  const handleToggleStatus = async (company) => {
    const activating = !company.is_active;
    const result = await showConfirm(
      activating ? "¿Activar empresa?" : "¿Inactivar empresa?",
      activating
        ? `"${company.nombre_comercial}" va a volver a estar disponible para seleccionarse.`
        : `"${company.nombre_comercial}" ya no va a aparecer para elegirse en actas, cotizaciones ni certificados nuevos.`
    );
    if (!result.isConfirmed) return;

    try {
      await updateCompanyStatus(company.id, activating);
      showSuccess(activating ? "La empresa fue activada." : "La empresa fue inactivada.");
      loadCompanies();
    } catch (error) {
      let message = "No fue posible cambiar el estado de la empresa.";
      try {
        message = JSON.parse(error.message).message;
      } catch {
        message = error.message || message;
      }
      showError(message);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-6 flex flex-wrap items-center justify-end gap-3">
        <button
          onClick={openCreate}
          className="rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-brand-950 transition hover:bg-accent-strong hover:text-white"
        >
          + Nueva empresa
        </button>
      </div>

      <div className="mb-5 flex flex-wrap gap-3 rounded-2xl border border-edge bg-surface p-3">
        <input
          type="text"
          placeholder="Buscar por nombre, razón social o cédula jurídica..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="flex-1 min-w-[220px] rounded-xl border border-edge bg-surface-2 px-4 py-2 text-ink placeholder-ink-dim/60 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent-strong transition"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-edge bg-surface-2 px-4 py-2 text-ink focus:outline-none focus:ring-2 focus:ring-accent/40 transition"
        >
          <option value="">Todas</option>
          <option value="active">Activas</option>
          <option value="inactive">Inactivas</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-edge bg-surface shadow-sm">
        <table className="w-full text-ink">
          <thead className="bg-surface-2">
            <tr className="text-left text-xs font-semibold uppercase tracking-wide text-ink-dim">
              <th className="px-6 py-3.5">Nombre comercial</th>
              <th className="px-6 py-3.5">Razón social</th>
              <th className="px-6 py-3.5 font-data font-semibold">Cédula jurídica</th>
              <th className="px-6 py-3.5">Contacto</th>
              <th className="px-6 py-3.5">Proyecto</th>
              <th className="px-6 py-3.5">Estado</th>
              <th className="px-6 py-3.5">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-ink-dim">
                  Cargando empresas...
                </td>
              </tr>
            ) : companies.length > 0 ? (
              companies.map((c) => (
                <tr key={c.id} className="border-t border-edge transition hover:bg-surface-2/60">
                  <td className="px-6 py-4 font-medium">{c.nombre_comercial}</td>
                  <td className="px-6 py-4 text-ink-dim">{c.razon_social}</td>
                  <td className="px-6 py-4 font-data text-ink-dim">{c.cedula_juridica}</td>
                  <td className="px-6 py-4 text-ink-dim">
                    <div>{c.contact_name}</div>
                    <div className="text-xs">{c.contact_position}</div>
                    <div className="font-data text-xs">Ced: {c.contact_id}</div>
                    <div className="font-data text-xs">Tel: {c.contact_phone} · Cel: {c.contact_cell}</div>
                    <div className="text-xs">{c.email}</div>
                  </td>
                  <td className="px-6 py-4 text-ink-dim">{c.project || "—"}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${
                        c.is_active
                          ? "bg-quotes-soft text-quotes-strong"
                          : "bg-danger-soft text-danger"
                      }`}
                    >
                      {c.is_active ? "Activa" : "Inactiva"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEdit(c)}
                        aria-label={`Editar ${c.nombre_comercial}`}
                        title={`Editar ${c.nombre_comercial}`}
                        className="rounded-lg border border-edge p-2 text-ink-dim transition hover:bg-surface-2 hover:text-ink"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(c)}
                        aria-label={c.is_active ? `Inactivar ${c.nombre_comercial}` : `Activar ${c.nombre_comercial}`}
                        title={c.is_active ? `Inactivar ${c.nombre_comercial}` : `Activar ${c.nombre_comercial}`}
                        className={
                          c.is_active
                            ? "rounded-lg border border-danger/20 bg-danger-soft p-2 text-danger transition hover:brightness-95"
                            : "rounded-lg border border-edge bg-surface-2 p-2 text-ink-dim transition hover:bg-surface"
                        }
                      >
                        {c.is_active ? <PowerOff size={16} /> : <Power size={16} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="py-10 text-center text-ink-dim">
                  No hay empresas registradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <Pager page={page} pageSize={PAGE_SIZE} totalCount={totalCount} onPageChange={setPage} />
      </div>

      {showModal && (
        <ModalCompany
          company={selectedCompany}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false);
            loadCompanies();
          }}
        />
      )}
    </div>
  );
}
