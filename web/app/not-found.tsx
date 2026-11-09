import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { EvaluationIllustration } from "../Components/EcoIllustrations";

export const metadata: Metadata = {
  title: "Página no encontrada | EcoWay",
};

// 404 de todo el sitio: Next la muestra para cualquier ruta que no existe
// y cuando una pagina llama a notFound()
export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-b from-brand-50 to-white text-ink">
      <header className="bg-brand-900">
        <div className="mx-auto flex max-w-7xl items-center px-6 py-3.5 md:px-10">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="rounded-xl bg-white p-1">
              <Image src="/Images/logo.webp" alt="EcoWay" width={34} height={38} />
            </span>
            <span className="font-display text-lg font-bold tracking-tight text-white">
              Eco<span className="text-leaf">Way</span>
            </span>
          </Link>
        </div>
      </header>

      <section className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="max-w-lg text-center">
          <EvaluationIllustration className="mx-auto h-36 w-36" />

          <p className="font-data mt-8 text-6xl font-bold text-brand-700">404</p>
          <h1 className="font-display mt-3 text-2xl font-bold text-brand-950 sm:text-3xl">
            No encontramos esta página
          </h1>
          <p className="mt-3 text-ink-dim">
            Puede que el enlace esté mal escrito o que la página ya no exista.
            Revise la dirección o vuelva al inicio.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/"
              className="group inline-flex items-center gap-2 rounded-full bg-brand-700 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-brand-600"
            >
              <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-0.5" />
              Volver al inicio
            </Link>
            <a
              href="mailto:info@ecowaycr.com"
              className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-6 py-3.5 text-sm font-semibold text-brand-800 transition hover:border-brand-600"
            >
              <Mail size={16} />
              Contáctenos
            </a>
          </div>
        </div>
      </section>

      <footer className="py-6 text-center text-xs text-ink-dim/70">
        © 2026 DaeByte. All rights reserved.
      </footer>
    </main>
  );
}
