import { redirect } from "next/navigation";
import { getSettings } from "./db";
import { Feature, hasFeature, AddonKey, hasAddon } from "./plans";
import { getRequestStoreDb, getRequestBase } from "./tenant";
import { getActor, actorCan, firstAllowedPath } from "./actor";
import { Permission } from "./permissions";

// Si el plan del comercio actual no incluye la función, redirige a Mi plan.
export async function requireFeature(feature: Feature) {
  const settings = getSettings(await getRequestStoreDb());
  if (!hasFeature(settings, feature)) redirect(`${await getRequestBase()}/admin/plan`);
}

// Si el comercio no tiene contratada la integración, redirige a Mi plan.
export async function requireAddon(key: AddonKey) {
  const settings = getSettings(await getRequestStoreDb());
  if (!hasAddon(settings, key)) redirect(`${await getRequestBase()}/admin/plan`);
}

// Si el empleado actual no tiene el permiso, lo mandamos a su primera sección
// permitida (o a login si no hay sesión). El dueño siempre pasa.
export async function requirePermission(perm: Permission) {
  const base = await getRequestBase();
  const actor = await getActor();
  if (!actor) redirect(`${base}/ingresar`);
  if (!actorCan(actor, perm)) redirect(`${base}${firstAllowedPath(actor)}`);
}

// Solo el dueño (para gestión de empleados, plan, etc.).
export async function requireOwner() {
  const base = await getRequestBase();
  const actor = await getActor();
  if (!actor) redirect(`${base}/ingresar`);
  if (actor.kind !== "owner") redirect(`${base}${firstAllowedPath(actor)}`);
}
