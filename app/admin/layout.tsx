import { redirect } from "next/navigation";
import { getSettings } from "@/lib/db";
import AdminShell from "@/components/admin/AdminShell";
import { readableOn } from "@/lib/colors";
import { getRequestStoreDb, getRequestBase } from "@/lib/tenant";
import { getActor } from "@/lib/actor";

export const dynamic = "force-dynamic";

export default async function AdminRootLayout({ children }: { children: React.ReactNode }) {
  // Requiere sesión (dueño o empleado activo) para este comercio.
  const base = await getRequestBase();
  const actor = await getActor();
  if (!actor) redirect(`${base}/ingresar`);

  const settings = getSettings(await getRequestStoreDb());
  const brand = settings.color_accent || settings.brand_color || "#EA580C";
  const vars = {
    ["--brand" as string]: brand,
    ["--brand-text" as string]: readableOn(brand),
  };
  return (
    <div style={vars}>
      <AdminShell settings={settings} base={base} permissions={actor.permissions} actorName={actor.name} isOwner={actor.kind === "owner"}>
        {children}
      </AdminShell>
    </div>
  );
}
