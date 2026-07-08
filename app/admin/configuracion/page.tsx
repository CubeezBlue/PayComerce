import { getSettings } from "@/lib/db";
import SettingsForm from "@/components/admin/SettingsForm";
import { getRequestStoreDb, getRequestBase } from "@/lib/tenant";
import { mpOauthConfigured } from "@/lib/mp";

export const dynamic = "force-dynamic";

export default async function ConfiguracionPage({ searchParams }: { searchParams: Promise<{ bienvenida?: string; mp?: string }> }) {
  const settings = getSettings(await getRequestStoreDb());
  const sp = await searchParams;
  return (
    <SettingsForm
      initial={settings}
      base={await getRequestBase()}
      welcome={sp.bienvenida === "1"}
      mpOauthEnabled={mpOauthConfigured()}
      mpResult={sp.mp ?? ""}
    />
  );
}
