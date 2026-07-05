import { NextRequest, NextResponse } from "next/server";
import { getSettings } from "@/lib/db";
import { storeDbFromReq, slugFromReq } from "@/lib/tenant";
import { verifyPassword, hashPassword, sessionToken, SESSION_COOKIE } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const db = storeDbFromReq(req);
  const slug = slugFromReq(req);
  const { password } = await req.json();
  const pw = String(password ?? "");
  if (pw.length < 4) return NextResponse.json({ error: "La contraseña debe tener 4+ caracteres" }, { status: 400 });

  const settings = getSettings(db);
  const stored = settings.admin_password_hash;

  // Primera vez (sin contraseña): la definimos ahora.
  if (!stored) {
    db.prepare("INSERT INTO settings (key, value) VALUES ('admin_password_hash', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(hashPassword(pw));
  } else if (!verifyPassword(pw, stored)) {
    return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, sessionToken(slug), {
    httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
