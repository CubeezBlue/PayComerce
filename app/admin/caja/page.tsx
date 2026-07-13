import CajaManager from "@/components/admin/CajaManager";
import { requireAddon, requirePermission } from "@/lib/guard";
import { getSettings, getBranches } from "@/lib/db";
import { getRequestStoreDb } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export default async function CajaPage() {
  await requirePermission("caja");
  await requireAddon("caja");
  const db = await getRequestStoreDb();
  const settings = getSettings(db);
  const branches = getBranches(false, db);
  return <CajaManager currency={settings.currency || "$"} branches={branches} />;
}
