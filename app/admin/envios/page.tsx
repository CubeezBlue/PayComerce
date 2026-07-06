import DeliveryZonesManager from "@/components/admin/DeliveryZonesManager";
import { requireAddon } from "@/lib/guard";
import { getSettings } from "@/lib/db";
import { getRequestStoreDb } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export default async function EnviosPage() {
  await requireAddon("delivery");
  const settings = getSettings(await getRequestStoreDb());
  return <DeliveryZonesManager currency={settings.currency || "$"} />;
}
