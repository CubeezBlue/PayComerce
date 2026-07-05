import { NextRequest, NextResponse } from "next/server";
import { getProductOptionGroups, setProductOptions } from "@/lib/db";
import { storeDbFromReq } from "@/lib/tenant";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;
  return NextResponse.json(getProductOptionGroups(Number(id), storeDbFromReq(req)));
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const groups = Array.isArray(body.groups) ? body.groups : [];
  setProductOptions(Number(id), groups, storeDbFromReq(req));
  return NextResponse.json({ ok: true });
}
