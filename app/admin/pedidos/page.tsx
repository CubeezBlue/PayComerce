import { getBranches } from "@/lib/db";
import OrdersBoard from "@/components/admin/OrdersBoard";
import { requireFeature } from "@/lib/guard";
import { getRequestStoreDb } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export default async function PedidosPage() {
  await requireFeature("orders_board");
  const branches = getBranches(false, await getRequestStoreDb());
  return <OrdersBoard branches={branches} />;
}
