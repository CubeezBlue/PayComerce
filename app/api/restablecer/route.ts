import { NextRequest, NextResponse } from "next/server";
import { setStorePasswordHash, storeExists } from "@/lib/db";
import { verifyResetToken, hashPassword, validatePassword } from "@/lib/auth";

// Restablece la contraseña usando el token del email.
export async function POST(req: NextRequest) {
  const { token, password } = await req.json();
  const slug = verifyResetToken(String(token ?? ""), Date.now());
  if (!slug || !storeExists(slug))
    return NextResponse.json({ error: "El enlace es inválido o venció. Pedí uno nuevo." }, { status: 400 });

  const pwErr = validatePassword(String(password ?? ""));
  if (pwErr) return NextResponse.json({ error: pwErr }, { status: 400 });

  setStorePasswordHash(slug, hashPassword(String(password)));
  return NextResponse.json({ ok: true });
}
