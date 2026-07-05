import { headers } from "next/headers";
import CreateStore from "@/components/marketing/CreateStore";

export const dynamic = "force-dynamic";

// Dominio base (sin subdominio): localhost:3000, paycomerce.com, etc.
function baseHostOf(host: string): string {
  const [hostname, port] = host.split(":");
  const labels = hostname.split(".");
  // Si hay subdominio (3+ labels en dominio real), lo quitamos
  const base = labels.length > 2 ? labels.slice(1).join(".") : hostname;
  return port ? `${base}:${port}` : base;
}

export default async function CrearTiendaPage() {
  const host = (await headers()).get("host") || "paycomerce.com";
  return (
    <div style={{ ["--pc" as string]: "#4f46e5" }} className="min-h-screen bg-white text-neutral-900">
      <CreateStore baseHost={baseHostOf(host)} />
    </div>
  );
}
