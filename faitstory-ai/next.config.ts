import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Not using output: "standalone" on purpose: Prisma 7's generated client
  // ships as plain TS bundled by Next, and getting its runtime files right
  // in a traced standalone output is fiddly to verify without a Docker
  // daemon at hand. Shipping full node_modules in the image is simpler and
  // safer for a v1 that must actually run correctly.
};

export default nextConfig;
