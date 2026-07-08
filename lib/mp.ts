// Mercado Pago OAuth (conectar la cuenta del comercio, modelo marketplace).
// PayComerce registra UNA app en MP Developers (MP_CLIENT_ID/MP_CLIENT_SECRET);
// cada comercio autoriza y guardamos su access_token para cobrar en su nombre.

export function mpOauthConfigured(): boolean {
  return !!(process.env.MP_CLIENT_ID?.trim() && process.env.MP_CLIENT_SECRET?.trim());
}

export function mpAuthorizeUrl(state: string, redirectUri: string): string {
  const clientId = process.env.MP_CLIENT_ID?.trim() || "";
  const p = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    platform_id: "mp",
    state,
    redirect_uri: redirectUri,
  });
  return `https://auth.mercadopago.com.ar/authorization?${p.toString()}`;
}

export type MpTokenResponse = {
  access_token: string;
  refresh_token?: string;
  user_id?: number | string;
  public_key?: string;
  live_mode?: boolean;
};

// Intercambia el "code" del callback por el access_token del comercio.
export async function mpExchangeCode(code: string, redirectUri: string): Promise<MpTokenResponse | null> {
  const client_id = process.env.MP_CLIENT_ID?.trim();
  const client_secret = process.env.MP_CLIENT_SECRET?.trim();
  if (!client_id || !client_secret) return null;
  try {
    const res = await fetch("https://api.mercadopago.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ client_id, client_secret, code, grant_type: "authorization_code", redirect_uri: redirectUri }),
    });
    if (!res.ok) return null;
    return (await res.json()) as MpTokenResponse;
  } catch {
    return null;
  }
}
