import { redirect } from "next/navigation";
import { getSettings, subscriptionState, subscriptionUsable, setStoreSettings } from "@/lib/db";
import AdminShell from "@/components/admin/AdminShell";
import SubscriptionPaywall from "@/components/admin/SubscriptionPaywall";
import { readableOn } from "@/lib/colors";
import { getRequestStoreDb, getRequestBase, getRequestSlug } from "@/lib/tenant";
import { getActor } from "@/lib/actor";
import { getPreapproval, subscriptionConfigured } from "@/lib/mp-subscription";

export const dynamic = "force-dynamic";

export default async function AdminRootLayout({ children }: { children: React.ReactNode }) {
  // Requiere sesión (dueño o empleado activo) para este comercio.
  const base = await getRequestBase();
  const actor = await getActor();
  if (!actor) redirect(`${base}/ingresar`);

  const slug = await getRequestSlug();
  let settings = getSettings(await getRequestStoreDb());

  // Paywall: sin suscripción activa no se puede usar el panel. La 'demo' está exenta.
  if (slug !== "demo" && !subscriptionUsable(settings)) {
    // Rechequeo en vivo por si el webhook de MP todavía no llegó tras dejar la tarjeta.
    if (subscriptionConfigured() && settings.mp_subscription_id) {
      const pre = await getPreapproval(settings.mp_subscription_id);
      if (pre?.status === "authorized") {
        setStoreSettings(slug, { subscription_status: "active" });
        settings = getSettings(await getRequestStoreDb());
      } else if (pre && (pre.status === "cancelled" || pre.status === "paused")) {
        setStoreSettings(slug, { subscription_status: "past_due" });
        settings = getSettings(await getRequestStoreDb());
      }
    }
    if (!subscriptionUsable(settings)) {
      const st = subscriptionState(settings);
      return <SubscriptionPaywall base={base} state={st === "past_due" || st === "expired" ? st : "pending"} storeName={settings.store_name || ""} />;
    }
  }
  const brand = settings.color_accent || settings.brand_color || "#EA580C";
  const vars = {
    ["--brand" as string]: brand,
    ["--brand-text" as string]: readableOn(brand),
  };
  return (
    <div style={vars}>
      <AdminShell settings={settings} base={base} permissions={actor.permissions} actorName={actor.name} isOwner={actor.kind === "owner"}>
        {children}
      </AdminShell>
    </div>
  );
}
