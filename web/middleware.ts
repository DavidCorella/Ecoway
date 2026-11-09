import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("EcowayAuth")?.value;
  const { pathname } = request.nextUrl;

  // no aplica a archivos estaticos
  if (
    pathname.startsWith("/_next") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const isPublic = pathname === "/" || pathname.startsWith("/Login");

  // Solo el sistema interno es privado. Asi una ruta que no existe llega
  // a la pagina 404 en vez de mandar a la landing. Si se agrega otra
  // ruta privada, hay que sumarla aca
  const isPrivate = pathname.startsWith("/MainSystemPage");

  // sin token y ruta privada, va a la landing
  if (!token && isPrivate) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // con token y esta en login, ya no necesita loguearse
  if (token && isPublic && !(pathname === "/")) {
    return NextResponse.redirect(new URL("/MainSystemPage", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|.*\\..*).*)"],
};