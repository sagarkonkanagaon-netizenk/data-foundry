import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["three"],
  // API routes read the markdown in /content at runtime.
  outputFileTracingIncludes: { "/api/**": ["./content/**/*"] },
};

export default nextConfig;
