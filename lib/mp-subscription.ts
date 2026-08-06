// Suscripción del SaaS: PayComerce le cobra la mensualidad al comercio mediante
// MP Suscripciones (preapproval), usando la cuenta de MP de PayComerce.
// Requiere el Access Token de producción de PayComerce en MP_ACCESS_TOKEN.

import { TRIAL_DAYS } from "./db";
import { log } from "./log";

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
export async function createPreapproval(i: PreapprovalInput): Promise<{ id: string; init_point: string } | { error: string }> {
  const token = platformMpToken();
  if (!token) return { error: "Falta MP_ACCESS_TOKEN en el servidor" };
  const annual = i.billing === "annual";
  const auto_recurring: Record<string, unknown> = {
    frequency: annual ? 12 : 1,
    frequency_type: "months",
    transaction_amount: i.amount,
    currency_id: "ARS",
  };
  // NOTA: MP tira "Internal server error" en un preapproval directo si mandamos
  // free_trial o start_date. Los omitimos: la suscripción se crea al toque y los
  // 14 días de prueba los maneja la app (subscription_status='trial' + trial_ends_at).
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
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.init_point) {
      // Motivo real que devuelve MP (para diagnosticar): message, cause[0].description, error…
      const reason =
        (Array.isArray(data?.cause) && data.cause[0]?.description) || data?.message || data?.error || `HTTP ${res.status}`;
      log.error("mp-subscription: no se pudo crear el preapproval", null, {
        status: res.status, reason, payerEmail: i.payerEmail, amount: i.amount, billing: i.billing || "monthly",
        mp: JSON.stringify(data).slice(0, 700),
      });
      return { error: String(reason).slice(0, 220) };
    }
    return { id: String(data.id), init_point: String(data.init_point) };
  } catch (e) {
    log.error("mp-subscription: excepción creando el preapproval", e);
    return { error: "No se pudo conectar con Mercado Pago" };
  }
}

// Actualiza el monto de una suscripción existente (cuando el comercio suma o saca
// un adicional, o cambia de plan). MP re-cobra el nuevo monto en el próximo ciclo.
export async function updatePreapprovalAmount(id: string, amount: number): Promise<{ ok: true } | { error: string }> {
  const token = platformMpToken();
  if (!token) return { error: "Falta MP_ACCESS_TOKEN" };
  try {
    const res = await fetch(`https://api.mercadopago.com/preapproval/${id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ auto_recurring: { transaction_amount: amount, currency_id: "ARS" } }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const reason = (Array.isArray(data?.cause) && data.cause[0]?.description) || data?.message || `HTTP ${res.status}`;
      log.error("mp-subscription: no se pudo actualizar el monto", null, { status: res.status, reason, amount });
      return { error: String(reason).slice(0, 200) };
    }
    return { ok: true };
  } catch (e) {
    log.error("mp-subscription: excepción actualizando el monto", e);
    return { error: "No se pudo conectar con Mercado Pago" };
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
