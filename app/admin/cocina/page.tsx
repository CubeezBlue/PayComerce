import CocinaKDS from "@/components/admin/CocinaKDS";
import { requireAddon, requirePermission } from "@/lib/guard";
import { getSettings } from "@/lib/db";
import { getRequestStoreDb } from "@/lib/tenant";
import { getActor } from "@/lib/actor";

export const dynamic = "force-dynamic";

export default async function CocinaPage() {
  await requirePermission("cocina");
  await requireAddon("cocina");
  const settings = getSettings(await getRequestStoreDb());
  const actor = await getActor();
  return (
    <CocinaKDS
      prepDefault={Number(settings.kds_prep_minutes) || 15}
      canConfig={actor?.kind === "owner" || (actor?.permissions.includes("config") ?? false)}
    />
  );
}
