import { getSettings, getBranches } from "@/lib/db";
import SiteShell from "@/components/SiteShell";
import { hasAddon } from "@/lib/plans";
import { getRequestStoreDb } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const db = await getRequestStoreDb();
  const settings = getSettings(db);
  const branches = getBranches(true, db);

  // No exponer secretos al cliente; solo flags de integraciones activas.
  const { mp_access_token, afip_access_token, ...publicSettings } = settings;
  void afip_access_token;
  // Pago online: requiere la integración contratada + token cargado
  publicSettings.mp_enabled = hasAddon(settings, "mp") && mp_access_token ? "1" : "";
  // Factura: requiere la integración de ARCA contratada
  publicSettings.arca_enabled = hasAddon(settings, "arca") ? "1" : "";

  return (
    <SiteShell settings={publicSettings} branches={branches}>
      {children}
    </SiteShell>
  );
}
