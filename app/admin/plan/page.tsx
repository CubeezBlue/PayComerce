import { getSettings } from "@/lib/db";
import PlanManager from "@/components/admin/PlanManager";
import { getRequestStoreDb, getRequestBase } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export default async function PlanPage() {
  return <PlanManager initial={getSettings(await getRequestStoreDb())} base={await getRequestBase()} />;
}
