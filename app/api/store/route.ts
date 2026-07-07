import { NextRequest, NextResponse } from "next/server";
import { setStorePaused, deleteStore } from "@/lib/db";
import { slugFromReq } from "@/lib/tenant";
import { checkSession, SESSION_COOKIE } from "@/lib/auth";

function authed(req: NextRequest): string | null {
  const slug = slugFromReq(req);
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  return checkSession(slug, token) ? slug : null;
}

// El comercio pausa / reactiva su propia tienda.
export async function PATCH(req: NextRequest) {
  const slug = authed(req);
  if (!slug) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const b = await req.json();
  setStorePaused(slug, !!b.paused);
  return NextResponse.json({ ok: true });
}

// El comercio elimina su propia tienda (cancelación total). Cierra la sesión.
export async function DELETE(req: NextRequest) {
  const slug = authed(req);
  if (!slug) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (slug === "demo") return NextResponse.json({ error: "No se puede eliminar el demo" }, { status: 400 });
  const ok = deleteStore(slug);
  if (!ok) return NextResponse.json({ error: "No se pudo eliminar" }, { status: 400 });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  res.cookies.set("pc_store", "", { path: "/", maxAge: 0 });
  return res;
}
