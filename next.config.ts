import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Kunci root ke folder project ini agar Turbopack tidak naik ke ~/Documents
  // (ada lockfile nyasar di sana yang tidak bisa dibaca karena proteksi macOS).
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
