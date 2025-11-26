import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'komikcast03.com',
      },
      {
        protocol: 'https',
        hostname: '**.komikcast.com',
      },
      {
        protocol: 'https',
        hostname: '**.komikcast.site',
      },
      {
        protocol: 'https',
        hostname: '**.komikindo.ch',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
    ],
  },
};

export default nextConfig;
