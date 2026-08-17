import type { NextConfig } from "next";

// Static export for GitHub Pages (repo project page: https://<owner>.github.io/Claud/).
// Render keeps using the normal server build (`next start`), unaffected since
// this only activates when NEXT_STATIC_EXPORT=true is set at build time.
const isStaticExport = process.env.NEXT_STATIC_EXPORT === "true";

const nextConfig: NextConfig = {
  ...(isStaticExport && {
    output: "export",
    basePath: "/Claud",
    images: { unoptimized: true },
  }),
};

export default nextConfig;
