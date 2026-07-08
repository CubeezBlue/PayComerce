import { NextRequest, NextResponse } from "next/server";
import { slugFromReq } from "@/lib/tenant";
import { checkSession, SESSION_COOKIE } from "@/lib/auth";
import { setStoreSettings } from "@/lib/db";

// El comercio desconecta su cuenta de Mercado Pago (borra el token guardado).
export async function POST(req: NextRequest) {
  const slug = slugFromReq(req);
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!checkSession(slug, token)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  setStoreSettings(slug, { mp_access_token: "", mp_refresh_token: "", mp_user_id: "", mp_public_key: "", mp_connected: "" });
  return NextResponse.json({ ok: true });
}
