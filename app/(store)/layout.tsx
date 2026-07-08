import { getSettings, getBranches, getDeliveryBands, subscriptionState } from "@/lib/db";
import SiteShell from "@/components/SiteShell";
import { hasAddon } from "@/lib/plans";
import { getRequestStoreDb, getRequestBase } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const db = await getRequestStoreDb();
  const base = await getRequestBase();
  const settings = getSettings(db);
  const branches = getBranches(true, db);

  // Suscripción vencida/impaga: se bloquea el storefront (el admin sigue para pagar).
  const subState = subscriptionState(settings);
  const subBlocked = subState === "expired" || subState === "past_due";

  // Tienda en pausa o suscripción vencida: no se muestra el catálogo ni se toman pedidos.
  if (settings.paused === "1" || subBlocked) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-neutral-50 px-6 text-center text-neutral-700">
        <span className="text-5xl">🛠️</span>
        <h1 className="text-2xl font-bold">{settings.store_name || "Esta tienda"} no está disponible</h1>
        <p className="max-w-sm text-neutral-500">Estamos haciendo cambios y volvemos en un ratito. ¡Gracias por tu paciencia!</p>
      </div>
    );
  }

  // No exponer secretos al cliente; solo flags de integraciones activas.
  const { mp_access_token, afip_access_token, ...publicSettings } = settings;
  void afip_access_token;
  // Pago online: requiere la integración contratada + token cargado
  publicSettings.mp_enabled = hasAddon(settings, "mp") && mp_access_token ? "1" : "";
  // Factura: requiere la integración de ARCA contratada
  publicSettings.arca_enabled = hasAddon(settings, "arca") ? "1" : "";
  // Delivery por radio de cobertura: requiere la integración contratada
  const deliveryOn = hasAddon(settings, "delivery");
  publicSettings.delivery_enabled = deliveryOn ? "1" : "";
  const bands = deliveryOn ? getDeliveryBands(db) : [];

  return (
    <SiteShell settings={publicSettings} branches={branches} bands={bands} base={base}>
      {children}
    </SiteShell>
  );
}
