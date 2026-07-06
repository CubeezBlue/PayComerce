import type { Metadata } from "next";
import RequestReset from "@/components/marketing/RequestReset";

export const metadata: Metadata = { title: "Recuperar contraseña — PayComerce" };
export const dynamic = "force-dynamic";

export default function RecuperarPage() {
  return <RequestReset />;
}
