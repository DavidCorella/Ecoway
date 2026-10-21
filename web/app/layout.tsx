import type { Metadata } from "next";
import { Geist, Geist_Mono, Sora } from "next/font/google";
import Providers from "../Components/Providers"
import "./globals.css";
// sin este import los popups de SweetAlert2 salen sin caja, sombra ni
// espaciado, y el reset de Tailwind tambien les quita los margenes
// por defecto, asi que el titulo y el texto quedan pegados
import "sweetalert2/dist/sweetalert2.min.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Fuente de titulares de la landing, se usa con la clase .font-display de globals.css
const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Ecoway",
  description: "Ecoway",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${sora.variable} h-full antialiased scroll-smooth`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}