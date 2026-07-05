import type { Metadata } from "next";
import Pricing from "@/components/marketing/Pricing";

export const metadata: Metadata = {
  title: "PayComerce — Planes y precios",
  description: "Tu tienda online, pagos y facturación. Planes desde $14.900/mes, sin comisión por venta.",
};

export default function PreciosPage() {
  return <Pricing />;
}
