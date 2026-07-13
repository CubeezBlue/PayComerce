import PriceAdjuster from "@/components/admin/PriceAdjuster";
import { requireFeature, requirePermission } from "@/lib/guard";

export const dynamic = "force-dynamic";

export default async function PreciosPage() {
  await requirePermission("precios");
  await requireFeature("price_adjust");
  return <PriceAdjuster />;
}
