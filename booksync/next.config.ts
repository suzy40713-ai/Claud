import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

/**
 * Domaine personnalisé : l'ancienne adresse *.onrender.com redirige (301) vers l'adresse publique,
 * sauf les routes /api (webhooks Stripe et planificateur appelés à l'ancienne adresse).
 */
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
const usesCustomDomain = /^https:\/\//.test(appUrl) && !appUrl.includes(".onrender.com");

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  typedRoutes: true,
  serverExternalPackages: ["postgres"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async redirects() {
    if (!usesCustomDomain) return [];
    return [
      {
        source: "/:path((?!api/).*)",
        has: [{ type: "host", value: "(?<sub>.+)\\.onrender\\.com" }],
        destination: `${appUrl}/:path`,
        permanent: true,
      },
    ];
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
