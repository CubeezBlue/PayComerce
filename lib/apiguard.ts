import { NextRequest } from "next/server";
import { getSettings } from "./db";
import { storeDbFromReq } from "./tenant";
import { hasAddon, AddonKey } from "./plans";
import { getActor, actorCan } from "./actor";
import { Permission } from "./permissions";

// Guard para route handlers: exige un adicional contratado + un permiso del actor.
// Devuelve un mensaje de error (para responder 403) o null si puede seguir.
export async function guardAddonPerm(req: NextRequest, addon: AddonKey, perm: Permission): Promise<string | null> {
  if (!hasAddon(getSettings(storeDbFromReq(req)), addon)) return "El adicional necesario no está activo";
  if (!actorCan(await getActor(), perm)) return "No tenés permiso para esta acción";
  return null;
}

// Exige que el actor tenga un permiso (el dueño siempre pasa). Para endpoints de
// administración; NO usar en endpoints públicos (los del cliente de la tienda).
export async function guardPerm(perm: Permission): Promise<string | null> {
  return actorCan(await getActor(), perm) ? null : "No tenés permiso para esta acción";
}

// Exige simplemente una sesión válida (dueño o empleado activo).
export async function guardLoggedIn(): Promise<string | null> {
  return (await getActor()) ? null : "No autorizado";
}
