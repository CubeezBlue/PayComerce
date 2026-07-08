import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";

// Sirve las imágenes subidas desde UPLOAD_DIR (que vive fuera de la app para
// sobrevivir a los deploys). Next no sirve rutas de disco arbitrarias, por eso
// esta ruta las lee y las devuelve.
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), "public", "uploads");

const TYPES: Record<string, string> = {
  png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg",
  webp: "image/webp", svg: "image/svg+xml", gif: "image/gif",
};

export async function GET(_req: NextRequest, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const safe = path.basename(file); // evita path traversal
  const full = path.join(UPLOAD_DIR, safe);
  if (!fs.existsSync(full)) return new NextResponse("No encontrado", { status: 404 });
  const buf = fs.readFileSync(full);
  const ext = (safe.split(".").pop() || "").toLowerCase();
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": TYPES[ext] || "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
