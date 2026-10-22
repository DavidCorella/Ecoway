"use client";

import Image from "next/image";
import { useState } from "react";
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
  Leaf,
} from "lucide-react";
import {
  EvaluationIllustration,
  ProposalIllustration,
  TruckIllustration,
  CertificateIllustration,
  RecycleIllustration,
  CompaniesIllustration,
  SproutIllustration,
} from "../Components/EcoIllustrations";

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
    Illustration: EvaluationIllustration,
    title: "Evaluación",
    text: "Análisis del residuo y de la viabilidad del servicio.",
  },
  {
    Illustration: ProposalIllustration,
    title: "Propuesta",
    text: "Cotización clara y aprobación formal del cliente.",
  },
  {
    Illustration: TruckIllustration,
    title: "Ejecución",
    text: "Recolección, verificación y tratamiento del material.",
  },
  {
    Illustration: CertificateIllustration,
    title: "Cierre",
    text: "Disposición final y certificación de lo gestionado.",
  },
];

const IMPACTS = [
  {
    Illustration: RecycleIllustration,
    value: "2,500+",
    text: "Toneladas de residuos tratados",
  },
  {
    Illustration: CompaniesIllustration,
    value: "5,000+",
    text: "Empresas atendidas",
  },
  {
    Illustration: SproutIllustration,
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

// Encabezado comun de cada seccion: etiqueta chica + titulo (+ texto opcional)
function SectionHeading({ eyebrow, title, text }: { eyebrow: string; title: string; text?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <span className="eyebrow-display inline-flex items-center gap-1.5 text-brand-600">
        <Leaf size={13} />
        {eyebrow}
      </span>
      <h2 className="font-display mt-3 text-3xl font-bold text-brand-950 sm:text-4xl">{title}</h2>
      {text && <p className="mt-4 text-ink-dim">{text}</p>}
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-white text-ink overflow-x-hidden">
      {/* ================================================================ */}
      {/* NAVBAR — verde oscuro solido para que se distinga sobre */}
      {/* cualquier seccion (todas son claras) */}
      {/* ================================================================ */}
      <header className="sticky top-0 z-50 bg-brand-900 shadow-[0_8px_24px_-12px_rgba(8,26,18,0.5)]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5 md:px-10">
          <a href="#inicio" className="flex items-center gap-2.5">
            <span className="rounded-xl bg-white p-1">
              <Image src="/Images/logo.webp" alt="EcoWay" width={34} height={38} priority />
            </span>
            <span className="font-display text-lg font-bold tracking-tight text-white">
              Eco<span className="text-leaf">Way</span>
            </span>
          </a>

          {/* NAV DESKTOP */}
          <nav className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-[14.5px] font-medium text-white/75 transition hover:text-leaf"
              >
                {link.label}
              </a>
            ))}

            {/* El login es solo para personal de EcoWay, no para clientes —
                por eso queda como enlace chico, no como CTA principal. */}
            <button
              onClick={() => router.push("/Login")}
              className="text-xs font-medium text-white/50 transition hover:text-white"
            >
              Acceso interno
            </button>

            <a
              href="#contacto"
              className="rounded-full bg-leaf px-5 py-2.5 text-sm font-semibold text-brand-950 transition hover:bg-white"
            >
              Contáctenos
            </a>
          </nav>

          {/* BOTON MOBILE */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            className="rounded-lg p-2 text-white md:hidden"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* NAV MOBILE */}
        {menuOpen && (
          <div className="border-t border-white/10 px-6 py-4 md:hidden">
            <nav className="flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white"
                >
                  {link.label}
                </a>
              ))}
              <a
                href="#contacto"
                onClick={() => setMenuOpen(false)}
                className="mt-2 rounded-full bg-leaf px-5 py-3 text-center text-sm font-semibold text-brand-950"
              >
                Contáctenos
              </a>
              <button
                onClick={() => router.push("/Login")}
                className="mt-1 py-2 text-center text-xs font-medium text-white/50"
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
      <section id="inicio" className="bg-gradient-to-b from-brand-50 to-white">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-20 md:grid-cols-2 md:items-center md:px-10 md:py-24">
          <div className="animate-ew-fade-up">
            <span className="eyebrow-display inline-flex items-center gap-2 rounded-full bg-brand-100 px-3.5 py-1.5 text-brand-700">
              <Leaf size={13} />
              Gestión Integral de Residuos y Materiales Peligrosos
            </span>

            <h1 className="font-display mt-5 text-[2.5rem] font-bold leading-[1.1] text-brand-950 sm:text-[3.4rem]">
              Desde el 2007 activamente{" "}
              <span className="text-brand-600">limpiando el mundo</span>.
            </h1>

            <p className="mt-5 max-w-lg text-lg leading-relaxed text-ink-dim">
              Somos una empresa dedicada a la Gestión Integral de Residuos y
              Materiales Peligrosos, así como a la consultoría y ejecución de
              proyectos enfocados en temas ambientales con sede en Costa Rica.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#servicios"
                className="group flex items-center gap-2 rounded-full bg-brand-700 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-brand-600"
              >
                Conocer servicios
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
              </a>
              <a
                href="#contacto"
                className="rounded-full border border-brand-200 bg-white px-6 py-3.5 text-sm font-semibold text-brand-800 transition hover:border-brand-600"
              >
                Contáctenos
              </a>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl">
            <Image
              src="/Images/hero-seedling.webp"
              alt="Manos sosteniendo un brote con tierra"
              width={1200}
              height={687}
              className="aspect-[4/3] w-full rounded-[2rem] object-cover shadow-[0_24px_60px_-30px_rgba(14,43,32,0.5)]"
              priority
            />
            <div className="absolute -bottom-5 left-6 flex items-center gap-2.5 rounded-2xl bg-white px-4 py-3 shadow-lg ring-1 ring-brand-100">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-700 text-leaf">
                <Recycle size={16} />
              </span>
              <div>
                <p className="font-data text-sm font-bold text-brand-800">2,500+ toneladas</p>
                <p className="text-[11px] text-ink-dim">de residuos tratados</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* NOSOTROS */}
      {/* ================================================================ */}
      <section id="nosotros" className="bg-white py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-6 md:px-10">
          <SectionHeading
            eyebrow="Por qué EcoWay"
            title="Compromiso ambiental desde el 2007"
            text="Más que solo destruir responsablemente los residuos o reutilizarlos, también realizamos otras funciones que se transformarán en grandes ventajas para su empresa, y harán que la tarea de cuidar el ambiente valga aún más la pena."
          />

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-2xl bg-brand-50 p-7">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-700 text-leaf">
                  <Icon size={20} />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-brand-950">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-dim">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* SERVICIOS */}
      {/* ================================================================ */}
      <section id="servicios" className="bg-brand-50 py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-6 md:px-10">
          <SectionHeading
            eyebrow="Nuestros servicios"
            title="Un servicio para cada etapa del residuo"
            text="Desde el primer diagnóstico hasta la disposición final, con un equipo humano y técnico especializado en cada etapa."
          />

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {SERVICES.map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="rounded-2xl bg-white p-6 ring-1 ring-brand-100 transition duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-brand-900/10"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
                  <Icon size={20} />
                </div>
                <h3 className="mt-5 font-semibold leading-snug text-brand-950">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-dim">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* PROCESO */}
      {/* ================================================================ */}
      <section id="proceso" className="bg-white py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-6 md:px-10">
          <SectionHeading eyebrow="Cómo trabajamos" title="Cuatro pasos claros, de principio a fin" />

          <div className="relative mt-14 grid gap-10 md:grid-cols-4 md:gap-6">
            <div className="pointer-events-none absolute left-[12%] right-[12%] top-11 hidden h-px bg-brand-200 md:block" />

            {STEPS.map(({ Illustration, ...step }, i) => (
              <div key={step.title} className="relative text-center">
                <div className="relative mx-auto h-[88px] w-[88px] rounded-full ring-8 ring-white">
                  <Illustration className="h-full w-full" />
                  <span className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-brand-700 text-xs font-bold text-white">
                    {i + 1}
                  </span>
                </div>
                <h3 className="mt-5 font-semibold text-brand-950">{step.title}</h3>
                <p className="mx-auto mt-1.5 max-w-[14rem] text-sm text-ink-dim">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* IMPACTO */}
      {/* ================================================================ */}
      <section id="impacto" className="bg-brand-50 py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-6 md:px-10">
          <SectionHeading eyebrow="Impacto medible" title="Resultados con impacto real" />

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {IMPACTS.map(({ Illustration, ...item }) => (
              <div key={item.text} className="flex flex-col items-center rounded-2xl bg-white p-8 text-center ring-1 ring-brand-100">
                <Illustration className="h-20 w-20" />
                <p className="font-data mt-4 text-4xl font-bold text-brand-700">{item.value}</p>
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
      <section id="contacto" className="bg-white px-6 py-20 md:px-10 md:py-24">
        <div className="mx-auto grid max-w-7xl gap-10 rounded-[2rem] bg-brand-700 px-8 py-12 sm:px-12 md:grid-cols-[1.2fr_0.8fr] md:items-center md:px-14 md:py-16">
          <div>
            <span className="eyebrow-display text-leaf">Hablemos</span>
            <h2 className="font-display mt-3 text-3xl font-bold text-white sm:text-4xl">
              ¿Listos para gestionar sus residuos con nosotros?
            </h2>
            <p className="mt-4 max-w-md text-white/75">
              Escríbenos y nuestro equipo se encarga de la recolección, el
              tratamiento y la certificación, con más de 15 años de
              experiencia respaldando cada proceso.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="mailto:info@ecowaycr.com"
                className="group inline-flex items-center gap-2 rounded-full bg-leaf px-6 py-3.5 text-sm font-semibold text-brand-950 transition hover:bg-white"
              >
                Escríbenos
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
              </a>
              <a
                href="tel:+50622652486"
                className="inline-flex items-center gap-2 rounded-full border border-white/30 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                <Phone size={16} />
                (506) 2265-2486
              </a>
            </div>
          </div>

          <ul className="space-y-4">
            {[
              "Certificados de gestión con respaldo documental",
              "Más de 15 años de experiencia en gestión ambiental",
              "Atención directa, sin intermediarios",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-white/85">
                <CircleCheckBig size={18} className="mt-0.5 shrink-0 text-leaf" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ================================================================ */}
      {/* FOOTER — mismo verde que el navbar */}
      {/* ================================================================ */}
      <footer className="bg-brand-900 pt-14 text-white">
        <div className="mx-auto max-w-7xl px-6 pb-8 md:px-10">
          <div className="grid gap-10 border-b border-white/10 pb-10 md:grid-cols-[1.3fr_1fr_1fr]">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="rounded-xl bg-white p-1">
                  <Image src="/Images/logo.webp" alt="EcoWay" width={34} height={38} />
                </span>
                <span className="font-display text-lg font-bold">
                  Eco<span className="text-leaf">Way</span>
                </span>
              </div>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/60">
                Empresa dedicada a la Gestión Integral de Residuos y Materiales
                Peligrosos, así como a la consultoría y ejecución de proyectos
                ambientales, con sede en Costa Rica.
              </p>
            </div>

            <div>
              <h4 className="eyebrow-display text-leaf">Navegación</h4>
              <ul className="mt-4 space-y-2.5 text-sm text-white/65">
                {NAV_LINKS.map((link) => (
                  <li key={link.href}>
                    <a href={link.href} className="transition hover:text-white">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="eyebrow-display text-leaf">Contacto</h4>
              <ul className="mt-4 space-y-3 text-sm text-white/65">
                <li className="flex items-center gap-2.5">
                  <Phone size={16} className="text-leaf" />
                  (506) 2265-2486
                </li>
                <li className="flex items-center gap-2.5">
                  <Mail size={16} className="text-leaf" />
                  info@ecowaycr.com
                </li>
                <li className="flex items-center gap-2.5">
                  <MapPin size={16} className="text-leaf" />
                  Tacacorí de Alajuela, Costa Rica
                </li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col-reverse items-center gap-3 pt-6 sm:flex-row sm:justify-between">
            <p className="text-xs text-white/50">
              © 2026 David Corella S. All rights reserved.
            </p>
            <button
              onClick={() => router.push("/Login")}
              className="text-xs font-medium text-white/45 transition hover:text-leaf"
            >
              Acceso interno · personal EcoWay
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
