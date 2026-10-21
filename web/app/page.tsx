"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Menu,
  X,
  ArrowRight,
  ShieldCheck,
  Users,
  Award,
  Recycle,
  Boxes,
  Wrench,
  ClipboardList,
  Phone,
  Mail,
  MapPin,
  CircleCheckBig,
} from "lucide-react";

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "Más de 15 años de trayectoria",
    text: "Activos desde el 2007, brindando soluciones ambientales integrales a empresas en todo Costa Rica.",
  },
  {
    icon: Users,
    title: "Equipo humano y técnico propio",
    text: "Contamos con todos los recursos humanos y técnicos necesarios para ejecutar cada proyecto de principio a fin.",
  },
  {
    icon: Award,
    title: "Gestión integral, no solo recolección",
    text: "Además de tratar y disponer los residuos, ofrecemos consultoría ambiental y ejecución de proyectos a la medida.",
  },
];

const SERVICES = [
  {
    icon: Recycle,
    title: "Gestión y tratamiento de residuos",
    text: "Conocé nuestra gestión en el tratamiento de residuos peligrosos.",
  },
  {
    icon: Boxes,
    title: "Almacenamiento y administración de inventarios",
    text: "La importancia del almacenamiento y administración de inventarios.",
  },
  {
    icon: Wrench,
    title: "Desmantelamiento de instalaciones industriales",
    text: "Ecoway cuenta con todos los recursos humanos y técnicos para hacer de esta labor, la mejor.",
  },
  {
    icon: ClipboardList,
    title: "Consultoría ambiental, asesoría y capacitación",
    text: "Ecoway CR no sólo realiza labores de limpieza industrial, también capacitamos y damos asesorías a compañías que las necesiten.",
  },
];

const STEPS = [
  {
    img: "/Images/truckImpactContainer.webp",
    title: "Evaluación",
    text: "Análisis del residuo y de la viabilidad del servicio.",
  },
  {
    img: "/Images/boxImpactContainer.webp",
    title: "Propuesta",
    text: "Cotización clara y aprobación formal del cliente.",
  },
  {
    img: "/Images/buildingImpactContainer.webp",
    title: "Ejecución",
    text: "Recolección, verificación y tratamiento del material.",
  },
  {
    img: "/Images/certificatedImpactcontainer.webp",
    title: "Cierre",
    text: "Disposición final y certificación de lo gestionado.",
  },
];

const IMPACTS = [
  {
    img: "/Images/bagImpactcontainer.webp",
    value: "2,500+",
    text: "Toneladas de residuos tratados",
  },
  {
    img: "/Images/treeImpactContainer.webp",
    value: "5,000+",
    text: "Empresas atendidas",
  },
  {
    img: "/Images/tableImpactContainer.webp",
    value: "50+",
    text: "Programas ambientales implementados",
  },
];

const NAV_LINKS = [
  { href: "#nosotros", label: "Nosotros" },
  { href: "#servicios", label: "Servicios" },
  { href: "#proceso", label: "Proceso" },
  { href: "#impacto", label: "Impacto" },
  { href: "#contacto", label: "Contacto" },
];

export default function Home() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-white text-ink overflow-x-hidden">
      {/* ================================================================ */}
      {/* NAVBAR */}
      {/* ================================================================ */}
      <header
        className={`sticky top-0 z-50 border-b border-edge bg-white transition-shadow duration-300 ${
          scrolled ? "shadow-[0_12px_24px_-16px_rgba(14,43,32,0.25)]" : "shadow-none"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 md:px-10">
          <a href="#inicio" className="flex items-center gap-2.5">
            <Image src="/Images/logo.webp" alt="EcoWay" width={42} height={46} priority />
            <span className="text-lg font-semibold tracking-tight text-brand-900">
              Eco<span className="text-brand-600">Way</span>
            </span>
          </a>

          {/* NAV DESKTOP */}
          <nav className="hidden items-center gap-9 md:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="group relative text-[14.5px] font-medium text-ink-dim transition hover:text-brand-800"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 h-[2px] w-0 bg-accent-strong transition-all duration-300 group-hover:w-full" />
              </a>
            ))}

            {/* El login es solo para personal de EcoWay, no para clientes —
                por eso queda como enlace chico, no como CTA principal. */}
            <button
              onClick={() => router.push("/Login")}
              className="text-xs font-medium text-ink-dim/70 transition hover:text-brand-700"
            >
              Acceso interno
            </button>

            <a
              href="#contacto"
              className="group flex items-center gap-1.5 rounded-xl bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_24px_-10px_rgba(14,43,32,0.55)] transition hover:bg-brand-600"
            >
              Contactanos
              <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
            </a>
          </nav>

          {/* BOTON MOBILE */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            className="rounded-lg p-2 text-brand-900 md:hidden"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* NAV MOBILE */}
        {menuOpen && (
          <div className="border-t border-edge bg-white px-6 py-4 md:hidden">
            <nav className="flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-ink-dim hover:bg-surface-2 hover:text-brand-800"
                >
                  {link.label}
                </a>
              ))}
              <a
                href="#contacto"
                onClick={() => setMenuOpen(false)}
                className="mt-2 flex items-center justify-center gap-1.5 rounded-xl bg-brand-700 px-5 py-3 text-sm font-semibold text-white"
              >
                Contactanos
                <ArrowRight size={15} />
              </a>
              <button
                onClick={() => router.push("/Login")}
                className="mt-1 py-2 text-center text-xs font-medium text-ink-dim/70"
              >
                Acceso interno
              </button>
            </nav>
          </div>
        )}
      </header>

      {/* ================================================================ */}
      {/* HERO */}
      {/* ================================================================ */}
      <section id="inicio" className="relative overflow-hidden bg-white">
        <div className="relative mx-auto grid max-w-7xl gap-14 px-6 py-20 md:grid-cols-[1.05fr_0.95fr] md:items-center md:px-10 md:py-28">
          {/* TEXTO */}
          <div className="animate-ew-fade-up">
            <span className="eyebrow-display inline-flex items-center gap-2 rounded-full border border-brand-100 bg-white/70 px-3 py-1.5 text-brand-700">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-strong" />
              Gestión Integral de Residuos y Materiales Peligrosos
            </span>

            <h1 className="font-display mt-5 text-[2.6rem] font-bold leading-[1.08] text-brand-950 sm:text-6xl">
              Desde el 2007 activamente{" "}
              <span className="bg-gradient-to-r from-brand-600 via-brand-500 to-accent-strong bg-clip-text text-transparent">
                limpiando el mundo
              </span>
              .
            </h1>

            <p className="mt-5 max-w-lg text-lg leading-relaxed text-ink-dim">
              Somos una empresa dedicada a la Gestión Integral de Residuos y
              Materiales Peligrosos, así como a la consultoría y ejecución de
              proyectos enfocados en temas ambientales con sede en Costa Rica.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href="#servicios"
                className="group flex items-center gap-2 rounded-xl bg-brand-700 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_16px_32px_-14px_rgba(14,43,32,0.6)] transition hover:bg-brand-600"
              >
                Conocer servicios
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
              </a>
              <a
                href="#contacto"
                className="rounded-xl border border-brand-200 bg-white px-6 py-3.5 text-sm font-semibold text-brand-800 transition hover:border-brand-600 hover:text-brand-900"
              >
                Contactanos
              </a>
            </div>

            <div className="mt-11 flex flex-wrap gap-x-10 gap-y-4 border-t border-brand-100 pt-7">
              {IMPACTS.map((item) => (
                <div key={item.text}>
                  <p className="font-data text-2xl font-bold text-brand-800">{item.value}</p>
                  <p className="max-w-[11rem] text-xs text-ink-dim">{item.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ILUSTRACIÓN */}
          <div className="relative mx-auto w-full max-w-md">
            <div className="relative rounded-[2.5rem] border border-edge bg-white p-8 shadow-xl shadow-brand-900/5">
              <Image
                src="/Images/truckImpactContainer.webp"
                alt="Camión de recolección EcoWay"
                width={480}
                height={340}
                className="animate-ew-float mx-auto drop-shadow-xl"
                priority
              />

              <div className="absolute -left-6 top-10 flex items-center gap-2 rounded-2xl border border-edge bg-white px-3.5 py-2.5 shadow-xl">
                <CircleCheckBig size={18} className="text-accent-strong" />
                <span className="text-xs font-semibold text-brand-900">Gestión responsable</span>
              </div>

              <div className="absolute -right-4 bottom-6 flex items-center gap-2 rounded-2xl border border-edge bg-white px-3.5 py-2.5 shadow-xl">
                <Award size={18} className="text-materials-strong" />
                <span className="text-xs font-semibold text-brand-900">Certificado emitido</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* NOSOTROS / FEATURES */}
      {/* ================================================================ */}
      <section id="nosotros" className="mx-auto max-w-7xl px-6 py-20 md:px-10 md:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <span className="eyebrow-display text-brand-600">Por qué EcoWay</span>
          <h2 className="font-display mt-3 text-3xl font-bold text-brand-950 sm:text-4xl">
            Compromiso ambiental desde el 2007
          </h2>
          <p className="mt-4 text-ink-dim">
            Más que solo destruir responsablemente los residuos o reutilizarlos,
            también realizamos otras funciones que se transformarán en grandes
            ventajas para su empresa, y harán que la tarea de cuidar el ambiente
            valga aún más la pena.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="group rounded-2xl border border-edge bg-surface p-7 transition duration-300 hover:-translate-y-1.5 hover:border-brand-200 hover:shadow-xl hover:shadow-brand-900/10"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-soft text-accent-strong transition group-hover:bg-brand-700 group-hover:text-white">
                <Icon size={22} />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-brand-950">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-dim">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ================================================================ */}
      {/* SERVICIOS */}
      {/* ================================================================ */}
      <section id="servicios" className="bg-white py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6 md:px-10">
          <div className="mx-auto max-w-2xl text-center">
            <span className="eyebrow-display text-brand-600">Nuestros servicios</span>
            <h2 className="font-display mt-3 text-3xl font-bold text-brand-950 sm:text-4xl">
              Un servicio para cada etapa del residuo
            </h2>
            <p className="mt-4 text-ink-dim">
              Desde el primer diagnóstico hasta la disposición final, con un
              equipo humano y técnico especializado en cada etapa.
            </p>
          </div>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {SERVICES.map(({ icon: Icon, title, text }, i) => (
              <div
                key={title}
                className="group relative overflow-hidden rounded-2xl border border-edge bg-surface p-6 transition duration-300 hover:-translate-y-1.5 hover:border-brand-200 hover:shadow-xl hover:shadow-brand-900/10"
              >
                <span className="font-data text-xs font-semibold text-ink-dim/40">
                  0{i + 1}
                </span>
                <div className="mt-4 flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent-strong transition group-hover:bg-brand-700 group-hover:text-white">
                  <Icon size={20} />
                </div>
                <h3 className="mt-4 font-semibold text-brand-950">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-dim">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* PROCESO */}
      {/* ================================================================ */}
      <section id="proceso" className="bg-white py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6 md:px-10">
          <div className="mx-auto max-w-2xl text-center">
            <span className="eyebrow-display text-brand-700">Cómo trabajamos</span>
            <h2 className="font-display mt-3 text-3xl font-bold text-brand-950 sm:text-4xl">
              Cuatro pasos claros, de principio a fin
            </h2>
          </div>

          <div className="relative mt-16 grid gap-8 md:grid-cols-4">
            <div className="pointer-events-none absolute left-0 right-0 top-[42px] hidden h-px bg-brand-200 md:block" />

            {STEPS.map((step, i) => (
              <div key={step.title} className="relative text-center">
                <div className="relative mx-auto flex h-[84px] w-[84px] items-center justify-center rounded-full border border-brand-100 bg-white shadow-lg shadow-brand-900/10">
                  <Image src={step.img} alt={step.title} width={52} height={52} />
                  <span className="absolute -top-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-brand-700 text-[11px] font-bold text-white ring-4 ring-[color:var(--brand-50)]">
                    {i + 1}
                  </span>
                </div>
                <h3 className="mt-5 font-semibold text-brand-950">{step.title}</h3>
                <p className="mt-1.5 px-2 text-sm text-ink-dim">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* IMPACTO */}
      {/* ================================================================ */}
      <section id="impacto" className="bg-white py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6 text-center md:px-10">
          <span className="eyebrow-display text-brand-700">Impacto medible</span>
          <h2 className="font-display mt-3 text-3xl font-bold text-brand-950 sm:text-4xl">
            Resultados con impacto real
          </h2>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {IMPACTS.map((item) => (
              <div
                key={item.text}
                className="flex flex-col items-center rounded-2xl border border-edge bg-surface p-8 shadow-sm transition duration-300 hover:-translate-y-1.5 hover:border-brand-200 hover:shadow-xl hover:shadow-brand-900/10"
              >
                <Image src={item.img} alt={item.text} width={64} height={64} />
                <h3 className="font-data mt-4 text-3xl font-bold text-brand-700">
                  {item.value}
                </h3>
                <p className="mt-1 text-sm text-ink-dim">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* CONTACTO — orientado a un cliente que quiere el servicio, no a */}
      {/* "acceder al sistema" (eso es solo para personal de EcoWay). */}
      {/* ================================================================ */}
      <section id="contacto" className="mx-auto max-w-7xl px-6 py-20 md:px-10 md:py-28">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-brand-950 px-8 py-14 sm:px-14 md:px-16 md:py-20">
          {/* halo de luz + anillos finos en vez de blobs difusos */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(31,209,168,0.16),transparent_55%)]" />
          <div className="pointer-events-none absolute -bottom-28 -right-28 h-80 w-80 rounded-full border border-white/[0.08]" />
          <div className="pointer-events-none absolute -bottom-10 -right-10 h-52 w-52 rounded-full border border-white/[0.08]" />

          <div className="relative grid gap-12 md:grid-cols-[1.2fr_0.8fr] md:items-center">
            <div>
              <span className="eyebrow-display text-accent">Hablemos</span>
              <h2 className="font-display mt-3 text-3xl font-bold text-white sm:text-4xl">
                ¿Listos para gestionar sus residuos con nosotros?
              </h2>
              <p className="mt-4 max-w-md text-white/60">
                Escríbenos y nuestro equipo se encarga de la recolección, el
                tratamiento y la certificación, con más de 15 años de
                experiencia respaldando cada proceso.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="mailto:info@ecowaycr.com"
                  className="group inline-flex items-center gap-2 rounded-xl bg-accent px-7 py-3.5 text-sm font-semibold text-brand-950 shadow-[0_16px_32px_-12px_rgba(31,209,168,0.45)] transition hover:bg-accent-strong hover:shadow-[0_20px_40px_-12px_rgba(31,209,168,0.6)]"
                >
                  Escríbenos
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                </a>
                <a
                  href="tel:+50622652486"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  <Phone size={16} />
                  (506) 2265-2486
                </a>
              </div>
            </div>

            <ul className="space-y-4 border-t border-white/10 pt-8 md:border-t-0 md:border-l md:pl-10 md:pt-0">
              {[
                "Certificados de gestión con respaldo documental",
                "Más de 15 años de experiencia en gestión ambiental",
                "Atención directa, sin intermediarios",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-white/75">
                  <CircleCheckBig size={18} className="mt-0.5 shrink-0 text-accent" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* FOOTER */}
      {/* ================================================================ */}
      <footer className="border-t border-edge bg-white pt-16">
        <div className="mx-auto max-w-7xl px-6 pb-10 md:px-10">
          <div className="grid gap-10 border-b border-brand-900/10 pb-12 md:grid-cols-[1.3fr_1fr_1fr]">
            <div>
              <div className="flex items-center gap-2.5">
                <Image src="/Images/logo.webp" alt="EcoWay" width={40} height={44} />
                <span className="text-lg font-semibold text-brand-900">EcoWay</span>
              </div>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-brand-900/70">
                Empresa dedicada a la Gestión Integral de Residuos y Materiales
                Peligrosos, así como a la consultoría y ejecución de proyectos
                ambientales, con sede en Costa Rica.
              </p>
            </div>

            <div>
              <h4 className="eyebrow-display text-brand-800">Navegación</h4>
              <ul className="mt-4 space-y-2.5 text-sm text-brand-900/70">
                {NAV_LINKS.map((link) => (
                  <li key={link.href}>
                    <a href={link.href} className="transition hover:text-brand-900">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="eyebrow-display text-brand-800">Contacto</h4>
              <ul className="mt-4 space-y-3 text-sm text-brand-900/70">
                <li className="flex items-center gap-2.5">
                  <Phone size={16} className="text-brand-700" />
                  (506) 2265-2486
                </li>
                <li className="flex items-center gap-2.5">
                  <Mail size={16} className="text-brand-700" />
                  info@ecowaycr.com
                </li>
                <li className="flex items-center gap-2.5">
                  <MapPin size={16} className="text-brand-700" />
                  Tacacorí de Alajuela, Costa Rica
                </li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col-reverse items-center gap-3 pt-6 sm:flex-row sm:justify-between">
            <p className="text-xs text-brand-900/60">
              © 2026 David Corella S. All rights reserved.
            </p>
            <button
              onClick={() => router.push("/Login")}
              className="text-xs font-medium text-brand-900/50 transition hover:text-brand-700"
            >
              Acceso interno · personal EcoWay
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
