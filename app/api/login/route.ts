import { NextRequest, NextResponse } from "next/server";
import { getStoreByEmail, getStoreDb, getSettings } from "@/lib/db";
import { verifyPassword, sessionToken, SESSION_COOKIE } from "@/lib/auth";
import { loginBlockedFor, loginFail, loginReset, reqIp } from "@/lib/ratelimit";

// Login global del comercio con email + contraseña. Busca la tienda por email,
// verifica la contraseña y deja la sesión iniciada para ese comercio.
export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  const mail = String(email ?? "").trim().toLowerCase();
  const pw = String(password ?? "");

  const rlKey = `login:${mail}:${reqIp(req)}`;
  const blocked = loginBlockedFor(rlKey);
  if (blocked > 0)
    return NextResponse.json({ error: `Demasiados intentos. Probá de nuevo en ${Math.ceil(blocked / 60)} minutos.` }, { status: 429 });

  const store = mail ? getStoreByEmail(mail) : null;
  const stored = store ? getSettings(getStoreDb(store.slug)).admin_password_hash : undefined;

  if (!store || !verifyPassword(pw, stored)) {
    loginFail(rlKey);
    return NextResponse.json({ error: "Email o contraseña incorrectos" }, { status: 401 });
  }

  loginReset(rlKey);
  const res = NextResponse.json({ slug: store.slug });
  res.cookies.set(SESSION_COOKIE, sessionToken(store.slug), {
    httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
