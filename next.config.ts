import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: isProd ? '/agreement_flow_3' : '',
  images: {
    unoptimized: true,
  },
  /* config options here */
};

export default nextConfig;
