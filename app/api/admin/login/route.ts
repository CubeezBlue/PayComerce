import { NextRequest, NextResponse } from "next/server";
import { getSettings } from "@/lib/db";
import { storeDbFromReq, slugFromReq } from "@/lib/tenant";
import { verifyPassword, hashPassword, sessionToken, SESSION_COOKIE, validatePassword } from "@/lib/auth";
import { loginBlockedFor, loginFail, loginReset, reqIp } from "@/lib/ratelimit";

export async function POST(req: NextRequest) {
  const db = storeDbFromReq(req);
  const slug = slugFromReq(req);
  const rlKey = `admin:${slug}:${reqIp(req)}`;

  const blocked = loginBlockedFor(rlKey);
  if (blocked > 0)
    return NextResponse.json({ error: `Demasiados intentos. Probá de nuevo en ${Math.ceil(blocked / 60)} minutos.` }, { status: 429 });

  const { password } = await req.json();
  const pw = String(password ?? "");

  const settings = getSettings(db);
  const stored = settings.admin_password_hash;

  // Primera vez (sin contraseña): la definimos ahora (exigimos contraseña fuerte).
  if (!stored) {
    const err = validatePassword(pw);
    if (err) return NextResponse.json({ error: err }, { status: 400 });
    db.prepare("INSERT INTO settings (key, value) VALUES ('admin_password_hash', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(hashPassword(pw));
  } else if (!verifyPassword(pw, stored)) {
    loginFail(rlKey);
    return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 });
  }

  loginReset(rlKey);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, sessionToken(slug), {
    httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
