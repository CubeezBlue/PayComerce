import { NextRequest, NextResponse } from "next/server";
import { checkOwner, OWNER_COOKIE } from "@/lib/auth";

// Diagnóstico (solo dueño): crea un preapproval MÍNIMO en MP y devuelve la respuesta
// cruda + el tipo de token (TEST vs producción). Nunca expone el token completo.
//   /api/owner/mp-test?email=TESTUSER....@testuser.com
export async function GET(req: NextRequest) {
  if (!checkOwner(req.cookies.get(OWNER_COOKIE)?.value)) {
    return NextResponse.json({ error: "No autorizado (entrá al panel de dueño)" }, { status: 401 });
  }
  const token = process.env.MP_ACCESS_TOKEN?.trim();
  if (!token) return NextResponse.json({ error: "Falta MP_ACCESS_TOKEN en el servidor" });

  const email = req.nextUrl.searchParams.get("email") || "test_user_123@testuser.com";
  const payload = {
    reason: "Prueba PayComerce",
    auto_recurring: { frequency: 1, frequency_type: "months", transaction_amount: 100, currency_id: "ARS" },
    back_url: "https://paycomerce.com",
    payer_email: email,
    status: "pending",
  };

  let mpStatus = 0;
  let mpResponse: unknown = null;
  try {
    const res = await fetch("https://api.mercadopago.com/preapproval", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    mpStatus = res.status;
    mpResponse = await res.json().catch(() => ({}));
  } catch (e) {
    mpResponse = { fetchError: e instanceof Error ? e.message : String(e) };
  }

  return NextResponse.json({
    tokenPrefix: token.slice(0, 8), // TEST-... o APP_USR- → sabemos si es sandbox o producción
    isTestToken: token.startsWith("TEST-"),
    payerEmailProbado: email,
    mpStatus,
    mpResponse,
  });
}
