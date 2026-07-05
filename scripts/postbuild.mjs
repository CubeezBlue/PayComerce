// Después de `next build` (output: standalone), Next NO copia solo los estáticos
// ni la carpeta public dentro de .next/standalone. Este script lo hace automático,
// así el servidor autónomo (.next/standalone/server.js) sirve todo bien.
import { cpSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const root = process.cwd();
const standalone = join(root, ".next", "standalone");

if (!existsSync(standalone)) {
  console.log("[postbuild] No hay .next/standalone (¿falta output: 'standalone'?). Nada que copiar.");
  process.exit(0);
}

// .next/static -> .next/standalone/.next/static
const staticSrc = join(root, ".next", "static");
const staticDst = join(standalone, ".next", "static");
if (existsSync(staticSrc)) {
  mkdirSync(join(standalone, ".next"), { recursive: true });
  cpSync(staticSrc, staticDst, { recursive: true });
  console.log("[postbuild] Copiado .next/static");
}

// public -> .next/standalone/public
const publicSrc = join(root, "public");
const publicDst = join(standalone, "public");
if (existsSync(publicSrc)) {
  cpSync(publicSrc, publicDst, { recursive: true });
  console.log("[postbuild] Copiado public");
}

console.log("[postbuild] Listo. Servidor autónomo completo en .next/standalone");
