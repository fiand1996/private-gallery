import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
  serverExternalPackages: ["exifr", "better-sqlite3", "sharp"],
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    localPatterns: [{ pathname: "/api/gallery/image" }],
    qualities: [60, 75, 80, 85],
    minimumCacheTTL: 2_592_000,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
