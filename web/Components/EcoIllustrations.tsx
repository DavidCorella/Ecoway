// Ilustraciones planas de la landing, dibujadas a mano en SVG con la misma
// paleta del sitio (ver globals.css). Todas comparten el circulo de fondo
// y el viewBox de 120x120, asi se ven como una sola familia.

const C = {
  bg: "#DCEFE2", // brand-100
  dark: "#175E3E", // brand-700
  mid: "#22935E", // brand-500
  soft: "#8CC5A0", // brand-300
  leaf: "#A3D96B",
  leafStrong: "#6FAE3A",
  ink: "#0E2B20", // brand-900
  soil: "#9C7A54",
};

type Props = { className?: string };

function Frame({ className, children }: Props & { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 120 120" fill="none" aria-hidden="true" className={className}>
      <circle cx="60" cy="60" r="56" fill={C.bg} />
      {children}
    </svg>
  );
}

// Evaluación: lupa sobre una hoja
export function EvaluationIllustration({ className }: Props) {
  return (
    <Frame className={className}>
      <path d="M30 82C30 54 50 36 82 34c0 30-20 48-52 48Z" fill={C.leaf} />
      <path d="M30 82 66 46" stroke={C.leafStrong} strokeWidth="3" strokeLinecap="round" />
      <circle cx="70" cy="64" r="16" fill="#fff" fillOpacity="0.55" stroke={C.dark} strokeWidth="5" />
      <path d="M82 76 94 88" stroke={C.dark} strokeWidth="8" strokeLinecap="round" />
    </Frame>
  );
}

// Propuesta: documento aprobado
export function ProposalIllustration({ className }: Props) {
  return (
    <Frame className={className}>
      <rect x="34" y="24" width="48" height="64" rx="7" fill="#fff" stroke={C.dark} strokeWidth="3" />
      <path d="M43 39h30M43 50h24M43 61h18" stroke={C.soft} strokeWidth="4" strokeLinecap="round" />
      <circle cx="80" cy="84" r="15" fill={C.mid} />
      <path d="m73 84 5 5 9-10" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    </Frame>
  );
}

// Ejecución: camión de recolección
export function TruckIllustration({ className }: Props) {
  return (
    <Frame className={className}>
      <path d="M16 87h88" stroke={C.soft} strokeWidth="3" strokeLinecap="round" />
      <rect x="20" y="44" width="52" height="34" rx="5" fill={C.mid} />
      <path d="M38 72c0-13 8-20 21-20 0 13-8 20-21 20Z" fill={C.leaf} />
      <path d="M72 54h17l11 13v11H72Z" fill={C.dark} />
      <path d="M77 59h10l7 8H77Z" fill={C.bg} />
      <circle cx="38" cy="79" r="8" fill={C.ink} />
      <circle cx="38" cy="79" r="3" fill={C.bg} />
      <circle cx="86" cy="79" r="8" fill={C.ink} />
      <circle cx="86" cy="79" r="3" fill={C.bg} />
    </Frame>
  );
}

// Cierre: sello de certificación con hoja
export function CertificateIllustration({ className }: Props) {
  return (
    <Frame className={className}>
      <path d="m48 70-7 24 11-5 6 9 4-22M72 70l7 24-11-5-6 9-4-22" fill={C.dark} />
      <circle cx="60" cy="52" r="25" fill={C.leaf} />
      <circle cx="60" cy="52" r="18" fill="#fff" stroke={C.mid} strokeWidth="2.5" />
      <path d="M51 61c0-11 6-17 17-17 0 11-6 17-17 17Z" fill={C.mid} />
      <path d="m51 61 10-10" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
    </Frame>
  );
}

// Toneladas tratadas: flechas de reciclaje alrededor de una hoja
export function RecycleIllustration({ className }: Props) {
  return (
    <Frame className={className}>
      <path d="M36 60a24 24 0 0 1 41-17" stroke={C.mid} strokeWidth="7" strokeLinecap="round" />
      <path d="M69 45 80 46 79 35" stroke={C.mid} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M84 60a24 24 0 0 1-41 17" stroke={C.dark} strokeWidth="7" strokeLinecap="round" />
      <path d="M51 75 40 74 41 85" stroke={C.dark} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M50 70c0-14 8-20 21-20 0 14-8 20-21 20Z" fill={C.leaf} />
    </Frame>
  );
}

// Empresas atendidas: edificios con una hoja
export function CompaniesIllustration({ className }: Props) {
  return (
    <Frame className={className}>
      <path d="M22 88h76" stroke={C.soft} strokeWidth="3" strokeLinecap="round" />
      <rect x="28" y="48" width="28" height="40" rx="3" fill={C.dark} />
      {[54, 64, 74].map((y) =>
        [34, 45].map((x) => <rect key={`${x}-${y}`} x={x} y={y} width="6" height="5" rx="1" fill={C.bg} />)
      )}
      <rect x="58" y="34" width="32" height="54" rx="3" fill={C.mid} />
      {[42, 52, 62, 72].map((y) =>
        [64, 77].map((x) => <rect key={`${x}-${y}`} x={x} y={y} width="7" height="5" rx="1" fill="#EEF6F0" />)
      )}
      <path d="M82 34c0-12 7-18 18-18 0 11-7 18-18 18Z" fill={C.leaf} />
    </Frame>
  );
}

// Programas ambientales: brote creciendo de la tierra
export function SproutIllustration({ className }: Props) {
  return (
    <Frame className={className}>
      <path d="M28 88c8-13 56-13 64 0Z" fill={C.soil} />
      <path d="M60 84V54" stroke={C.mid} strokeWidth="4" strokeLinecap="round" />
      <path d="M60 66c-4-13-14-19-27-17 2 13 13 19 27 17Z" fill={C.mid} />
      <path d="M60 57c3-15 14-23 29-21-2 15-14 22-29 21Z" fill={C.leaf} />
    </Frame>
  );
}
