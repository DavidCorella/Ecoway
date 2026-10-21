"use client";

import { useState } from "react";
import { X, Download, Loader2 } from "lucide-react";
import { showError } from "../utils/alerts";

// Visor de imagen a pantalla completa, se abre al hacer click en la foto
// del acta. La descarga baja la imagen como blob en vez de usar un <a
// download> directo, porque ese atributo no siempre fuerza la descarga
// si el API queda en otro dominio que el frontend
export default function ImageLightbox({ src, alt, fileName, onClose }) {
  const [downloading, setDownloading] = useState(false);

  if (!src) return null;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      // cache: "no-store": el <img> de la miniatura ya trajo
      // esta misma URL en modo "no-cors", y si el fetch reutiliza esa
      // respuesta cacheada/revalidada (304) en vez de pedirla de nuevo,
      // el navegador la trata como si no tuviera headers de CORS y tira
      // "blocked by CORS policy" aunque el servidor si los mande bien
      const res = await fetch(src, { credentials: "include", cache: "no-store" });
      if (!res.ok) throw new Error();

      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName || "foto-acta.jpg";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(blobUrl);
    } catch {
      showError("No fue posible descargar la imagen.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 p-4"
      onClick={onClose}
    >
      <div className="absolute right-4 top-4 flex gap-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleDownload();
          }}
          disabled={downloading}
          aria-label="Descargar imagen"
          title="Descargar imagen"
          className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur transition hover:bg-white/20 disabled:opacity-60"
        >
          {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
          Descargar
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          title="Cerrar"
          className="rounded-xl bg-white/10 p-2 text-white backdrop-blur transition hover:bg-white/20"
        >
          <X size={20} />
        </button>
      </div>

      {/* stopPropagation para que hacer click en la imagen no cierre el visor */}
      <img
        src={src}
        alt={alt}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
      />
    </div>
  );
}
