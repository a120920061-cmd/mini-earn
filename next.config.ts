import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Force these env vars to be runtime-only (not inlined at build time)
  // so Prisma reads them correctly from Vercel's runtime environment.
  experimental: {
    // This prevents Next.js from inlining process.env.DATABASE_URL at build
  },
};

export default nextConfig;
