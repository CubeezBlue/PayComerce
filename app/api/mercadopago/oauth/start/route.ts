import { NextRequest, NextResponse } from "next/server";
import { slugFromReq } from "@/lib/tenant";
import { checkSession, SESSION_COOKIE, signOauthState } from "@/lib/auth";
import { mpOauthConfigured, mpAuthorizeUrl } from "@/lib/mp";

// Inicia la conexión con Mercado Pago: manda al comercio a autorizar en MP.
export function GET(req: NextRequest) {
  const slug = slugFromReq(req);
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const base = `/t/${slug}`;
  if (!checkSession(slug, token)) return NextResponse.redirect(new URL(`${base}/ingresar`, req.url));
  if (!mpOauthConfigured())
    return NextResponse.redirect(new URL(`${base}/admin/configuracion?mp=noconfig`, req.url));

  const redirectUri = `${req.nextUrl.origin}/api/mercadopago/oauth/callback`;
  const state = signOauthState(slug);
  return NextResponse.redirect(mpAuthorizeUrl(state, redirectUri));
}
