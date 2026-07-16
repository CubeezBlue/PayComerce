import { NextRequest, NextResponse } from "next/server";
import { getProductOptionGroups, setProductOptions } from "@/lib/db";
import { storeDbFromReq } from "@/lib/tenant";
import { guardPerm } from "@/lib/apiguard";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;
  return NextResponse.json(getProductOptionGroups(Number(id), storeDbFromReq(req)));
}

export async function PUT(req: NextRequest, { params }: Params) {
  const gErr = await guardPerm("productos");
  if (gErr) return NextResponse.json({ error: gErr }, { status: 403 });
  const { id } = await params;
  const body = await req.json();
  const groups = Array.isArray(body.groups) ? body.groups : [];
  setProductOptions(Number(id), groups, storeDbFromReq(req));
  return NextResponse.json({ ok: true });
}
