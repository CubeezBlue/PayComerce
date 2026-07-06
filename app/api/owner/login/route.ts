import { NextRequest, NextResponse } from "next/server";
import { ownerEnabled, ownerPasswordOk, ownerToken, OWNER_COOKIE } from "@/lib/auth";

// Login del panel de dueño (super-admin de PayComerce). Contraseña = OWNER_PASSWORD.
export async function POST(req: NextRequest) {
  if (!ownerEnabled())
    return NextResponse.json({ error: "El panel de dueño no está configurado (falta OWNER_PASSWORD)." }, { status: 503 });

  const { password } = await req.json();
  if (!ownerPasswordOk(String(password ?? "")))
    return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(OWNER_COOKIE, ownerToken(), {
    httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
