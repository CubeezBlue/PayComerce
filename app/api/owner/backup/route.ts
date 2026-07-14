import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import { checkOwner, OWNER_COOKIE } from "@/lib/auth";
import { makeBackupTar } from "@/lib/backup";
import { log } from "@/lib/log";

// Descarga un backup (.tar.gz) de TODAS las bases. Solo el dueño de la plataforma.
export async function GET(req: NextRequest) {
  if (!checkOwner(req.cookies.get(OWNER_COOKIE)?.value)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const { file, count, cleanup } = await makeBackupTar();
    const buf = fs.readFileSync(file);
    cleanup();
    log.info("backup: descarga manual generada", { stores: count, bytes: buf.length });
    const name = file.split(/[/\\]/).pop() || "paycomerce-backup.tar.gz";
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/gzip",
        "Content-Disposition": `attachment; filename="${name}"`,
      },
    });
  } catch (e) {
    log.error("backup: falló la descarga manual", e);
    return NextResponse.json({ error: "No se pudo generar el backup" }, { status: 500 });
  }
}
