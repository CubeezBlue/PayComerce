import { NextRequest, NextResponse } from "next/server";
import { getStoreByEmail, getStoreDb, getSettings } from "@/lib/db";
import { makeResetToken } from "@/lib/auth";
import { sendEmail, resetEmailHtml, emailConfigured } from "@/lib/email";

// Pide recuperar contraseña: si el email existe, envía un link con token.
// Responde siempre igual para no revelar qué emails están registrados.
export async function POST(req: NextRequest) {
  const { email } = await req.json();
  const mail = String(email ?? "").trim().toLowerCase();
  const generic = NextResponse.json({ ok: true });

  const store = mail ? getStoreByEmail(mail) : null;
  if (!store) return generic;
  if (!emailConfigured()) {
    // Sin proveedor de email configurado no podemos enviar; lo dejamos registrado.
    console.warn("[recuperar] RESEND_API_KEY/EMAIL_FROM no configurados; no se envió email.");
    return generic;
  }

  const token = makeResetToken(store.slug, Date.now());
  const origin = req.nextUrl.origin;
  const link = `${origin}/restablecer?token=${encodeURIComponent(token)}`;
  const storeName = getSettings(getStoreDb(store.slug)).store_name || "tu tienda";
  await sendEmail(mail, "Restablecer tu contraseña — PayComerce", resetEmailHtml(storeName, link));
  return generic;
}
