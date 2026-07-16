import fs from "fs";
import path from "path";
import os from "os";

// Crea y limpia la carpeta de datos de prueba antes y después de la corrida.
const TEST_DATA = path.join(os.tmpdir(), "paycomerce-test-data");

export default function setup() {
  fs.rmSync(TEST_DATA, { recursive: true, force: true });
  fs.mkdirSync(TEST_DATA, { recursive: true });
  return () => {
    try { fs.rmSync(TEST_DATA, { recursive: true, force: true }); } catch { /* noop */ }
  };
}
