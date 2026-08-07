import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { setStorePaused, deleteStore, setStoreSettings } from "@/lib/db";
import { checkOwner, OWNER_COOKIE } from "@/lib/auth";

async function requireOwner(): Promise<boolean> {
  const token = (await cookies()).get(OWNER_COOKIE)?.value;
  return checkOwner(token);
}

type Params = { params: Promise<{ slug: string }> };

// Pausar/reactivar o marcar como cuenta cortesía (gratis, exenta del paywall) — dueño.
export async function PATCH(req: NextRequest, { params }: Params) {
  if (!(await requireOwner())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { slug } = await params;
  const b = await req.json();
  // Cuenta gratis: 'comp' no vence ni se cobra. Al quitarla vuelve a 'pending' (requiere pago).
  if ("comp" in b) setStoreSettings(slug, { subscription_status: b.comp ? "comp" : "pending" });
  if ("paused" in b) setStorePaused(slug, !!b.paused);
  return NextResponse.json({ ok: true });
}

// Eliminar una tienda por completo (dueño).
export async function DELETE(_req: NextRequest, { params }: Params) {
  if (!(await requireOwner())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { slug } = await params;
  if (slug === "demo") return NextResponse.json({ error: "No se puede eliminar el demo" }, { status: 400 });
  const ok = deleteStore(slug);
  if (!ok) return NextResponse.json({ error: "No se pudo eliminar" }, { status: 400 });
  return NextResponse.json({ ok: true });
}
