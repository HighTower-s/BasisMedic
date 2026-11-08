import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  async rewrites() {
    // Local dev: Next.js and FastAPI run on the same machine, proxy works same-origin.
    // Deployed (e.g. Vercel + Render on separate hosts): set API_BASE_URL to the
    // deployed FastAPI origin — the rewrite still makes API calls same-origin from the
    // browser's point of view, so no CORS is strictly required, but app/api.py's CORS
    // config covers the case where something calls the API origin directly too.
    const apiBase = process.env.API_BASE_URL || "http://localhost:8000";
    return [{ source: "/api/:path*", destination: `${apiBase}/api/:path*` }];
  },
  turbopack: {
    root: __dirname,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
