// NEXT_PUBLIC_API_URL se graba en el bundle al momento del build, no en
// runtime. Si falta en un build de produccion, mejor que reviente ahora
// y no que quede apuntando a localhost en la maquina de cada usuario.
if (process.env.NODE_ENV === "production" && !process.env.NEXT_PUBLIC_API_URL) {
  throw new Error(
    "Falta NEXT_PUBLIC_API_URL. Definila antes de compilar (ver .env.production.example)."
  );
}

// Todas las rutas del backend ahora viven bajo /api (ver
// ApiRoutePrefixConvention en el backend), asi que el fallback local
// tambien lo necesita.
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "https://localhost:7088/api";
