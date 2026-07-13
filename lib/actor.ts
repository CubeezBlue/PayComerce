import { cookies } from "next/headers";
import { SESSION_COOKIE, resolveSession } from "./auth";
import { getRequestSlug, getRequestStoreDb } from "./tenant";
import { getStaffById } from "./db";
import { Permission, PERMISSIONS, parsePermissions } from "./permissions";

// Quién está usando el panel: el dueño (todos los permisos) o un empleado (subset).
export type Actor = { kind: "owner" | "staff"; staffId: number | null; name: string; permissions: Permission[] };

// Actor de la request actual (server components / pages).
export async function getActor(): Promise<Actor | null> {
  const slug = await getRequestSlug();
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const session = resolveSession(slug, token);
  if (!session) return null;
  if (session.kind === "owner") return { kind: "owner", staffId: null, name: "Dueño", permissions: [...PERMISSIONS] };
  const st = getStaffById(session.staffId, await getRequestStoreDb());
  if (!st || !st.active) return null; // empleado borrado o desactivado → sin sesión válida
  return { kind: "staff", staffId: st.id, name: st.name || st.username, permissions: parsePermissions(st.permissions) };
}

export function actorCan(actor: Actor | null, perm: Permission): boolean {
  return !!actor && (actor.kind === "owner" || actor.permissions.includes(perm));
}

// Primera sección del panel que el actor puede ver (para redirigir tras login).
export function firstAllowedPath(actor: Actor): string {
  if (actorCan(actor, "pedidos")) return "/admin/pedidos";
  const order: Permission[] = ["caja", "productos", "precios", "sucursales", "envios", "config"];
  for (const p of order) if (actorCan(actor, p)) return `/admin/${p === "config" ? "configuracion" : p}`;
  return "/admin";
}
