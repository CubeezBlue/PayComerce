import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Empaqueta un servidor autónomo con solo lo necesario (ideal para Hostinger/VPS)
  output: "standalone",
  serverExternalPackages: ["better-sqlite3", "@afipsdk/afip.js"],
  // En hosting compartido el build es pesado (procesos/memoria limitados).
  // Ya validamos tipos y lint en local/CI, así que los saltamos en el build del
  // servidor para no reventar el límite de procesos del plan.
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
