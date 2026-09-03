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
  // แดชบอร์ด monitor เป็นไฟล์สแตติกที่ QA อัปทับเป็นรอบ ๆ (public/monitor/<slug>/index.html)
  // rewrite ให้เข้าถึงด้วย /monitor/<slug> ตรง ๆ โดยไม่ต้องต่อ /index.html
  async rewrites() {
    return [{ source: "/monitor/:slug", destination: "/monitor/:slug/index.html" }];
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // @ts-ignore
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
