import CatalogTools from "@/components/admin/CatalogTools";
import { requireFeature, requirePermission } from "@/lib/guard";

export const dynamic = "force-dynamic";

export default async function CatalogoPage() {
  await requirePermission("precios");
  await requireFeature("excel");
  return <CatalogTools />;
}
