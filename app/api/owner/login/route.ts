import { NextRequest, NextResponse } from "next/server";
import { ownerEnabled, ownerPasswordOk, ownerToken, OWNER_COOKIE } from "@/lib/auth";
import { loginBlockedFor, loginFail, loginReset, reqIp } from "@/lib/ratelimit";

// Login del panel de dueño (super-admin de PayComerce). Contraseña = OWNER_PASSWORD.
export async function POST(req: NextRequest) {
  if (!ownerEnabled())
    return NextResponse.json({ error: "El panel de dueño no está configurado (falta OWNER_PASSWORD)." }, { status: 503 });

  const rlKey = `owner:${reqIp(req)}`;
  const blocked = loginBlockedFor(rlKey);
  if (blocked > 0)
    return NextResponse.json({ error: `Demasiados intentos. Probá de nuevo en ${Math.ceil(blocked / 60)} minutos.` }, { status: 429 });

  const { password } = await req.json();
  if (!ownerPasswordOk(String(password ?? ""))) {
    loginFail(rlKey);
    return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 });
  }

  loginReset(rlKey);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(OWNER_COOKIE, ownerToken(), {
    httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
