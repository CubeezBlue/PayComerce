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
