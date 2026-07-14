import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import os from "os";
import { execFileSync } from "child_process";

// Mismas rutas que lib/db.ts.
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
const STORES_DIR = path.join(DATA_DIR, "stores");

// Todas las bases SQLite: registro + demo + una por comercio.
export function allDbFiles(): { file: string; name: string }[] {
  const list: { file: string; name: string }[] = [];
  for (const f of ["_registry.db", "paycomerce.db"]) {
    const p = path.join(DATA_DIR, f);
    if (fs.existsSync(p)) list.push({ file: p, name: f });
  }
  if (fs.existsSync(STORES_DIR)) {
    for (const f of fs.readdirSync(STORES_DIR)) {
      if (f.endsWith(".db")) list.push({ file: path.join(STORES_DIR, f), name: `stores/${f}` });
    }
  }
  return list;
}

// Copia CONSISTENTE (segura con WAL activo, aunque la app esté escribiendo) de
// cada base a destDir, respetando la estructura de carpetas.
export async function snapshotAll(destDir: string): Promise<number> {
  fs.mkdirSync(path.join(destDir, "stores"), { recursive: true });
  const files = allDbFiles();
  for (const { file, name } of files) {
    const src = new Database(file, { readonly: true });
    try {
      await src.backup(path.join(destDir, name)); // usa la Online Backup API de SQLite
    } finally {
      src.close();
    }
  }
  return files.length;
}

// Arma un .tar.gz con el snapshot de todas las bases. El caller debe llamar cleanup().
export async function makeBackupTar(): Promise<{ file: string; count: number; cleanup: () => void }> {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "pc-backup-"));
  const folder = `paycomerce-${stamp}`;
  const count = await snapshotAll(path.join(tmp, folder));
  const tarFile = path.join(tmp, `paycomerce-backup-${stamp}.tar.gz`);
  execFileSync("tar", ["-czf", tarFile, "--force-local", "-C", tmp, folder]);
  return { file: tarFile, count, cleanup: () => fs.rmSync(tmp, { recursive: true, force: true }) };
}
