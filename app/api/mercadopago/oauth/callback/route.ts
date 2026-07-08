import { NextRequest, NextResponse } from "next/server";
import { readOauthState } from "@/lib/auth";
import { mpExchangeCode } from "@/lib/mp";
import { setStoreSettings, storeExists } from "@/lib/db";

// MP redirige acá con ?code&state. Canjeamos el code por el token del comercio
// y lo guardamos en su tienda. Luego volvemos a Configuración.
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const slug = readOauthState(state);

  if (!slug || !storeExists(slug))
    return NextResponse.redirect(new URL(`/precios?mp=badstate`, req.url));

  const base = `/t/${slug}`;
  if (!code) return NextResponse.redirect(new URL(`${base}/admin/configuracion?mp=cancel`, req.url));

  const redirectUri = `${req.nextUrl.origin}/api/mercadopago/oauth/callback`;
  const tok = await mpExchangeCode(code, redirectUri);
  if (!tok?.access_token)
    return NextResponse.redirect(new URL(`${base}/admin/configuracion?mp=error`, req.url));

  setStoreSettings(slug, {
    mp_access_token: tok.access_token,
    mp_refresh_token: tok.refresh_token ?? "",
    mp_user_id: tok.user_id != null ? String(tok.user_id) : "",
    mp_public_key: tok.public_key ?? "",
    mp_connected: "1",
  });

  return NextResponse.redirect(new URL(`${base}/admin/configuracion?mp=ok`, req.url));
}
