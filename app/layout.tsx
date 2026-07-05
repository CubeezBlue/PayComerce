import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PayComerce — Tu tienda online por WhatsApp",
  description: "Catálogo online con pedidos por WhatsApp, carga masiva por Excel y aumentos de precio por porcentaje.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
