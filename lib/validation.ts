// Validaciones puras (sin dependencias de Node) — se usan en cliente y servidor.

// Reglas de contraseña: 8+ caracteres, una mayúscula, un número y un especial.
// Devuelve un mensaje de error, o null si es válida.
export function validatePassword(pw: string): string | null {
  if (pw.length < 8) return "La contraseña debe tener al menos 8 caracteres.";
  if (!/[A-Z]/.test(pw)) return "La contraseña debe incluir al menos una mayúscula.";
  if (!/[0-9]/.test(pw)) return "La contraseña debe incluir al menos un número.";
  if (!/[^A-Za-z0-9]/.test(pw)) return "La contraseña debe incluir al menos un carácter especial (ej: !@#$).";
  return null;
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
