import CatalogTools from "@/components/admin/CatalogTools";
import { requireFeature } from "@/lib/guard";

export const dynamic = "force-dynamic";

export default async function CatalogoPage() {
  await requireFeature("excel");
  return <CatalogTools />;
}
