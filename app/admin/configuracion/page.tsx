import { getSettings } from "@/lib/db";
import SettingsForm from "@/components/admin/SettingsForm";
import { getRequestStoreDb, getRequestBase } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export default async function ConfiguracionPage({ searchParams }: { searchParams: Promise<{ bienvenida?: string }> }) {
  const settings = getSettings(await getRequestStoreDb());
  const welcome = (await searchParams).bienvenida === "1";
  return <SettingsForm initial={settings} base={await getRequestBase()} welcome={welcome} />;
}
