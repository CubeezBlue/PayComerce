// Backup consistente de todas las bases SQLite (registro + demo + una por comercio).
// Pensado para correr en el servidor vía SSH desde GitHub Actions. Escribe un
// .tar.gz rotado en BACKUP_DIR y deja un "latest.tar.gz" para copiar afuera.
//
//   DATA_DIR=... BACKUP_DIR=... node backup.mjs
//
// better-sqlite3 se resuelve desde el node_modules de la app (correr desde APP_PATH).

import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import os from "os";
import { execFileSync } from "child_process";

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
const STORES_DIR = path.join(DATA_DIR, "stores");
const BACKUP_DIR = process.env.BACKUP_DIR || path.join(DATA_DIR, "..", "backups");
const KEEP = Number(process.env.BACKUP_KEEP || 14); // cuántos backups conservar

function allDbFiles() {
  const list = [];
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

async function main() {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "pc-backup-"));
  const folder = `paycomerce-${stamp}`;
  fs.mkdirSync(path.join(tmp, folder, "stores"), { recursive: true });

  const files = allDbFiles();
  for (const { file, name } of files) {
    const src = new Database(file, { readonly: true });
    try {
      await src.backup(path.join(tmp, folder, name)); // WAL-safe
    } finally {
      src.close();
    }
  }

  const out = path.join(BACKUP_DIR, `paycomerce-backup-${stamp}.tar.gz`);
  execFileSync("tar", ["-czf", out, "--force-local", "-C", tmp, folder]);
  fs.rmSync(tmp, { recursive: true, force: true });
  fs.copyFileSync(out, path.join(BACKUP_DIR, "latest.tar.gz"));

  // Rotación: conservar solo los últimos KEEP.
  const backups = fs.readdirSync(BACKUP_DIR).filter((f) => /^paycomerce-backup-.*\.tar\.gz$/.test(f)).sort();
  for (const old of backups.slice(0, Math.max(0, backups.length - KEEP))) {
    fs.rmSync(path.join(BACKUP_DIR, old), { force: true });
  }

  console.log(`BACKUP_OK stores=${files.length} file=${out} bytes=${fs.statSync(out).size}`);
}

main().catch((e) => { console.error("BACKUP_FAIL", e); process.exit(1); });
