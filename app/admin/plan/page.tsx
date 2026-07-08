import { getSettings, subscriptionState } from "@/lib/db";
import PlanManager from "@/components/admin/PlanManager";
import { getRequestStoreDb, getRequestBase } from "@/lib/tenant";
import { subscriptionConfigured } from "@/lib/mp-subscription";

export const dynamic = "force-dynamic";

export default async function PlanPage() {
  const settings = getSettings(await getRequestStoreDb());
  return (
    <PlanManager
      initial={settings}
      base={await getRequestBase()}
      subState={subscriptionState(settings)}
      trialEndsAt={settings.trial_ends_at || ""}
      billingEnabled={subscriptionConfigured()}
    />
  );
}
