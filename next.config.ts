import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: process.cwd(),
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-pg"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.r2.cloudflarestorage.com" },
      { protocol: "https", hostname: "*.r2.dev" },
      ...(process.env.NEXT_PUBLIC_CDN_HOSTNAME
        ? [{ protocol: "https" as const, hostname: process.env.NEXT_PUBLIC_CDN_HOSTNAME }]
        : []),
    ],
  },
};

export default nextConfig;
