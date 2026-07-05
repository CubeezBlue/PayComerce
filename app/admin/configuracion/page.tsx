import { getSettings } from "@/lib/db";
import SettingsForm from "@/components/admin/SettingsForm";
import { getRequestStoreDb } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export default async function ConfiguracionPage() {
  const settings = getSettings(await getRequestStoreDb());
  return <SettingsForm initial={settings} />;
}
