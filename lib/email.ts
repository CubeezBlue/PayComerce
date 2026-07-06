// Envío de emails vía Resend (https://resend.com). Requiere RESEND_API_KEY y
// EMAIL_FROM configurados como variables de entorno. Si no están, no se envía.

export function emailConfigured(): boolean {
  return !!(process.env.RESEND_API_KEY?.trim() && process.env.EMAIL_FROM?.trim());
}

export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  if (!key || !from) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject, html }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// Plantilla del email de recuperación de contraseña.
export function resetEmailHtml(storeName: string, link: string): string {
  return `
  <div style="font-family:system-ui,Segoe UI,Roboto,Arial,sans-serif;max-width:480px;margin:0 auto;color:#1c1917">
    <h2 style="color:#4f46e5">PayComerce</h2>
    <p>Recibimos un pedido para restablecer la contraseña de <b>${storeName}</b>.</p>
    <p>Hacé clic en el botón para elegir una nueva contraseña. El enlace vence en 1 hora.</p>
    <p style="margin:24px 0">
      <a href="${link}" style="background:#4f46e5;color:#fff;padding:12px 24px;border-radius:9999px;text-decoration:none;font-weight:600">
        Restablecer contraseña
      </a>
    </p>
    <p style="font-size:12px;color:#78716c">Si no fuiste vos, ignorá este email; tu contraseña no cambia.</p>
  </div>`;
}
