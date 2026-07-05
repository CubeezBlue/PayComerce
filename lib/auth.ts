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
