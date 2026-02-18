import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '',
    NEXT_PUBLIC_STORAGE_URL: process.env.NEXT_PUBLIC_STORAGE_URL || '',
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'erp.forwarddefense.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.blob.core.windows.net',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
