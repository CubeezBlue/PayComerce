import { redirect } from "next/navigation";
import { getSettings } from "./db";
import { Feature, hasFeature } from "./plans";
import { getRequestStoreDb, getRequestBase } from "./tenant";

// Si el plan del comercio actual no incluye la función, redirige a Mi plan.
export async function requireFeature(feature: Feature) {
  const settings = getSettings(await getRequestStoreDb());
  if (!hasFeature(settings, feature)) redirect(`${await getRequestBase()}/admin/plan`);
}
