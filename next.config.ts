import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    // bcryptjs is pure JS but ships CJS; keep it on the Node runtime.
    serverActions: {
      bodySizeLimit: "1mb",
    },
  },
};

export default nextConfig;
