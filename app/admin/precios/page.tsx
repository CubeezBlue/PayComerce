import PriceAdjuster from "@/components/admin/PriceAdjuster";
import { requireFeature } from "@/lib/guard";

export const dynamic = "force-dynamic";

export default async function PreciosPage() {
  await requireFeature("price_adjust");
  return <PriceAdjuster />;
}
