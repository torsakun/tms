import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
  // /docs/api reads docs/api-v1.md at request time; tracing doesn't pick that
  // up on its own, so a standalone build would ship without the file.
  outputFileTracingIncludes: {
    "/docs/api": ["./docs/api-v1.md"],
  },
  serverExternalPackages: ["@prisma/client", "prisma"],
  typescript: {
    ignoreBuildErrors: true,
  },
  // @ts-ignore
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
