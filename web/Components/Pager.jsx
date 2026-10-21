"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

// Paginador generico para las tablas del sistema. page es 1-based, igual
// que del lado del backend
export default function Pager({ page, pageSize, totalCount, onPageChange }) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const from = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalCount);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-edge px-6 py-3">
      <p className="text-sm text-ink-dim">
        {totalCount === 0
          ? "Sin resultados"
          : `Mostrando ${from}–${to} de ${totalCount}`}
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Página anterior"
          title="Página anterior"
          className="rounded-lg border border-edge p-1.5 text-ink-dim transition hover:bg-surface-2 disabled:opacity-40 disabled:hover:bg-transparent"
        >
          <ChevronLeft size={16} />
        </button>

        <span className="text-sm text-ink-dim">
          Página {page} de {totalPages}
        </span>

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Página siguiente"
          title="Página siguiente"
          className="rounded-lg border border-edge p-1.5 text-ink-dim transition hover:bg-surface-2 disabled:opacity-40 disabled:hover:bg-transparent"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
