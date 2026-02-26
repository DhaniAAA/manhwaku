import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

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
        hostname: 'komikindo.ch',
      },
      {
        protocol: 'https',
        hostname: '**.komikindo.ch',
      },
      {
        protocol: 'https',
        hostname: 'imageainewgeneration.lol',
      },
      {
        protocol: 'https',
        hostname: 'himmga.lat',
      },
      {
        protocol: 'https',
        hostname: 'gaimgame.pics',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
    ],
  },
};

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  org: "glitchtip",
  project: "manhwaku",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // Disable uploading source maps to Sentry completely as Glitchtip works fine without them
  // and we don't have an auth token set up for Glitchtip locally
  sourcemaps: {
    disable: true,
  }
});
