import { headers } from "next/headers";
import { getStoreDb, storeExists } from "./db";

// Slug del comercio de la request actual (lo setea el middleware). Vacío = demo.
export async function getRequestSlug(): Promise<string> {
  const h = await headers();
  const s = h.get("x-store-slug") || "";
  return s && storeExists(s) ? s : "demo";
}

// Base de datos del comercio de la request (para server components / pages).
export async function getRequestStoreDb() {
  return getStoreDb(await getRequestSlug());
}

// Igual pero desde un Request (para route handlers /api/*).
export function slugFromReq(req: { headers: { get(name: string): string | null } }): string {
  const s = req.headers.get("x-store-slug") || "";
  return s && storeExists(s) ? s : "demo";
}

export function storeDbFromReq(req: { headers: { get(name: string): string | null } }) {
  return getStoreDb(slugFromReq(req));
}
