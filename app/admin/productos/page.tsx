import ProductsManager from "@/components/admin/ProductsManager";
import { getSettings } from "@/lib/db";
import { hasFeature, productLimit } from "@/lib/plans";
import { getRequestStoreDb } from "@/lib/tenant";
import { requirePermission } from "@/lib/guard";

export const dynamic = "force-dynamic";

export default async function ProductosPage() {
  await requirePermission("productos");
  const settings = getSettings(await getRequestStoreDb());
  return <ProductsManager canVariants={hasFeature(settings, "variants")} productLimit={productLimit(settings)} />;
}
