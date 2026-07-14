// Suscripción del SaaS: PayComerce le cobra la mensualidad al comercio mediante
// MP Suscripciones (preapproval), usando la cuenta de MP de PayComerce.
// Requiere el Access Token de producción de PayComerce en MP_ACCESS_TOKEN.

import { TRIAL_DAYS } from "./db";

export function platformMpToken(): string | undefined {
  return process.env.MP_ACCESS_TOKEN?.trim();
}

export function subscriptionConfigured(): boolean {
  return !!platformMpToken();
}

type PreapprovalInput = { slug: string; planName: string; amount: number; payerEmail: string; backUrl: string; withTrial: boolean; billing?: "monthly" | "annual" };

// Crea la suscripción (preapproval) y devuelve el init_point donde el comercio
// carga la tarjeta. Con free_trial de TRIAL_DAYS días si withTrial.
// billing "annual" cobra cada 12 meses (el monto ya viene con el 20% aplicado).
export async function createPreapproval(i: PreapprovalInput): Promise<{ id: string; init_point: string } | null> {
  const token = platformMpToken();
  if (!token) return null;
  const annual = i.billing === "annual";
  const auto_recurring: Record<string, unknown> = {
    frequency: annual ? 12 : 1,
    frequency_type: "months",
    transaction_amount: i.amount,
    currency_id: "ARS",
  };
  if (i.withTrial) auto_recurring.free_trial = { frequency: TRIAL_DAYS, frequency_type: "days" };
  try {
    const res = await fetch("https://api.mercadopago.com/preapproval", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        reason: `Suscripción PayComerce — ${i.planName} (${annual ? "anual" : "mensual"})`,
        external_reference: i.slug,
        payer_email: i.payerEmail,
        back_url: i.backUrl,
        auto_recurring,
        status: "pending",
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.init_point) return null;
    return { id: String(data.id), init_point: String(data.init_point) };
  } catch {
    return null;
  }
}

// Consulta el estado de una suscripción en MP.
export async function getPreapproval(id: string): Promise<{ status: string; external_reference?: string } | null> {
  const token = platformMpToken();
  if (!token) return null;
  try {
    const res = await fetch(`https://api.mercadopago.com/preapproval/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const d = await res.json();
    return { status: String(d.status), external_reference: d.external_reference };
  } catch {
    return null;
  }
}
