import { NextRequest, NextResponse } from "next/server";
import { listStores, createStore, storeExists, isValidSlug } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

export function GET() {
  return NextResponse.json(listStores());
}

// Alta de un comercio nuevo: crea su registro + su propia base de datos.
export async function POST(req: NextRequest) {
  const b = await req.json();
  const name = String(b.name ?? "").trim();
  const slug = String(b.slug ?? "").trim().toLowerCase();
  const password = String(b.password ?? "");

  if (!name) return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });
  if (password && password.length < 4) return NextResponse.json({ error: "La contraseña debe tener 4+ caracteres" }, { status: 400 });
  if (!isValidSlug(slug))
    return NextResponse.json({ error: "La dirección debe tener 3+ letras, números o guiones (ej: mi-negocio)" }, { status: 400 });
  if (slug === "demo" || slug === "admin" || slug === "api" || slug === "precios" || slug === "t")
    return NextResponse.json({ error: "Esa dirección está reservada" }, { status: 409 });
  if (storeExists(slug)) return NextResponse.json({ error: "Esa dirección ya está en uso" }, { status: 409 });

  const store = createStore(slug, name, new Date().toISOString(), password ? hashPassword(password) : undefined);
  return NextResponse.json(store, { status: 201 });
}
