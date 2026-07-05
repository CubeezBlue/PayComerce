import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Empaqueta un servidor autónomo con solo lo necesario (ideal para Hostinger/VPS)
  output: "standalone",
  serverExternalPackages: ["better-sqlite3", "@afipsdk/afip.js"],
};

export default nextConfig;
