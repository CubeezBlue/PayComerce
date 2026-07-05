import { NextRequest, NextResponse } from "next/server";
import { getSettings } from "@/lib/db";
import { storeDbFromReq } from "@/lib/tenant";

export function GET(req: NextRequest) {
  return NextResponse.json(getSettings(storeDbFromReq(req)));
}

export async function PUT(req: NextRequest) {
  const db = storeDbFromReq(req);
  const body = (await req.json()) as Record<string, string>;
  const upsert = db.prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value");
  const run = db.transaction(() => {
    for (const [k, v] of Object.entries(body)) upsert.run(k, String(v));
  });
  run();
  return NextResponse.json({ ok: true });
}
