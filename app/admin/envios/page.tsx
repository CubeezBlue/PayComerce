import DeliveryCoverageManager from "@/components/admin/DeliveryCoverageManager";
import { requireAddon } from "@/lib/guard";
import { getSettings } from "@/lib/db";
import { getRequestStoreDb, getRequestBase } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export default async function EnviosPage() {
  await requireAddon("delivery");
  const settings = getSettings(await getRequestStoreDb());
  return <DeliveryCoverageManager currency={settings.currency || "$"} base={await getRequestBase()} />;
}
