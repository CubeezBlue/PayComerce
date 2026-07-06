import crypto from "crypto";

const SECRET = process.env.AUTH_SECRET || "paycomerce-dev-secret-change-me";

// Hash de contraseña con scrypt (salt aleatorio). Formato: "salt:hash".
export function hashPassword(pw: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const h = crypto.scryptSync(pw, salt, 32).toString("hex");
  return `${salt}:${h}`;
}

export function verifyPassword(pw: string, stored: string | undefined): boolean {
  if (!stored || !stored.includes(":")) return false;
  const [salt, h] = stored.split(":");
  const h2 = crypto.scryptSync(pw, salt, 32).toString("hex");
  const a = Buffer.from(h, "hex");
  const b = Buffer.from(h2, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// Token de sesión firmado (HMAC del slug). No se puede falsificar sin el SECRET.
export function sessionToken(slug: string): string {
  return crypto.createHmac("sha256", SECRET).update(slug).digest("hex");
}

export function checkSession(slug: string, token: string | undefined): boolean {
  if (!token) return false;
  const expected = sessionToken(slug);
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export const SESSION_COOKIE = "pc_auth";

// Las validaciones puras viven en lib/validation.ts (para poder usarlas también
// en el cliente sin arrastrar el módulo crypto). Re-exportadas por comodidad.
export { validatePassword, isValidEmail } from "./validation";

// ── Panel de dueño (super-admin de PayComerce) ──────────────────────────────
// Contraseña única del operador de la plataforma (no de un comercio).
export const OWNER_COOKIE = "pc_owner";

export function ownerPassword(): string | undefined {
  return process.env.OWNER_PASSWORD?.trim() || undefined;
}

// ¿El panel de dueño está habilitado? (requiere OWNER_PASSWORD configurada)
export function ownerEnabled(): boolean {
  return !!ownerPassword();
}

export function ownerPasswordOk(pw: string): boolean {
  const expected = ownerPassword();
  if (!expected) return false;
  const a = Buffer.from(pw);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// Token de sesión del dueño (HMAC de la propia contraseña → cambia si se rota).
export function ownerToken(): string {
  return crypto.createHmac("sha256", SECRET).update("owner:" + (ownerPassword() || "")).digest("hex");
}

export function checkOwner(token: string | undefined): boolean {
  if (!token || !ownerEnabled()) return false;
  const expected = ownerToken();
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
