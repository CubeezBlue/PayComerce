import MesasManager from "@/components/admin/MesasManager";
import { requireAddon, requirePermission } from "@/lib/guard";
import { getSettings, getProductsWithBranches } from "@/lib/db";
import { hasAddon } from "@/lib/plans";
import { getRequestStoreDb } from "@/lib/tenant";
import { getActor } from "@/lib/actor";

export const dynamic = "force-dynamic";

export default async function MesasPage() {
  await requirePermission("mesas");
  await requireAddon("mesas");
  const db = await getRequestStoreDb();
  const settings = getSettings(db);
  const actor = await getActor();
  // Catálogo simple (id, nombre, precio, categoría) para cargar consumos.
  const products = getProductsWithBranches(true, db).map((p) => ({ id: p.id, name: p.name, price: p.price, category_id: p.category_id }));
  return (
    <MesasManager
      currency={settings.currency || "$"}
      products={products}
      canConfig={actor?.kind === "owner" || (actor?.permissions.includes("config") ?? false)}
      hasCocina={hasAddon(settings, "cocina")}
    />
  );
}
