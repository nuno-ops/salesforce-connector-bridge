import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Every authenticated page reads the session cookie, so the app is fully
  // dynamic. Cache Components would add little and complicate auth.
  cacheComponents: false,
  serverExternalPackages: ["postgres"],
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
