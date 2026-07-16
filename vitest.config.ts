import { defineConfig } from "vitest/config";
import path from "path";
import os from "os";

// Las bases de prueba viven en una carpeta temporal, aislada del DATA_DIR real.
const TEST_DATA = path.join(os.tmpdir(), "paycomerce-test-data");

export default defineConfig({
  resolve: { alias: { "@": path.resolve(process.cwd()) } },
  // No procesamos CSS/PostCSS (Tailwind) en los tests: solo lógica de Node.
  css: { postcss: { plugins: [] } },
  test: {
    include: ["test/**/*.test.ts"],
    env: { DATA_DIR: TEST_DATA, AUTH_SECRET: "test-secret" },
    globalSetup: ["./test/globalSetup.ts"],
    // Un solo proceso: todas las bases SQLite de prueba comparten el mismo
    // _registry.db, así que evitamos "database is locked" por acceso concurrente.
    poolOptions: { forks: { singleFork: true } },
  },
});
