import { NextRequest, NextResponse } from "next/server";
import { listStores, createStore, storeExists, isValidSlug } from "@/lib/db";
import { hashPassword, sessionToken, SESSION_COOKIE, validatePassword, isValidEmail } from "@/lib/auth";
import { PLANS } from "@/lib/plans";

export function GET() {
  return NextResponse.json(listStores());
}

// Alta de un comercio nuevo: crea su registro + su propia base de datos.
export async function POST(req: NextRequest) {
  const b = await req.json();
  const name = String(b.name ?? "").trim();
  const slug = String(b.slug ?? "").trim().toLowerCase();
  const password = String(b.password ?? "");
  const email = String(b.email ?? "").trim().toLowerCase();
  const plan = b.plan && PLANS[b.plan as keyof typeof PLANS] ? String(b.plan) : "emprendedor";

  if (!name) return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });
  if (!isValidEmail(email)) return NextResponse.json({ error: "Ingresá un email válido" }, { status: 400 });
  const pwErr = validatePassword(password);
  if (pwErr) return NextResponse.json({ error: pwErr }, { status: 400 });
  if (!isValidSlug(slug))
    return NextResponse.json({ error: "La dirección debe tener 3+ letras, números o guiones (ej: mi-negocio)" }, { status: 400 });
  if (slug === "demo" || slug === "admin" || slug === "api" || slug === "precios" || slug === "t")
    return NextResponse.json({ error: "Esa dirección está reservada" }, { status: 409 });
  if (storeExists(slug)) return NextResponse.json({ error: "Esa dirección ya está en uso" }, { status: 409 });

  const store = createStore(slug, name, new Date().toISOString(), hashPassword(password), plan, email);

  const res = NextResponse.json(store, { status: 201 });
  // Auto-login: como acaban de definir su contraseña, los dejamos logueados
  // para mandarlos directo a configurar su tienda (token válido solo para este slug).
  if (password) {
    res.cookies.set(SESSION_COOKIE, sessionToken(slug), {
      httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30,
    });
  }
  return res;
}
