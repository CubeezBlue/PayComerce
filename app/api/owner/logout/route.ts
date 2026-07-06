import { NextResponse } from "next/server";
import { OWNER_COOKIE } from "@/lib/auth";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(OWNER_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
