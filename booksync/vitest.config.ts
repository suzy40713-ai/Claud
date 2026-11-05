import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  resolve: {
    // `server-only` interdit l'import côté client ; inutile (et bloquant) dans les tests Node.
    alias: { "server-only": new URL("./tests/stubs/server-only.ts", import.meta.url).pathname },
  },
  test: {
    projects: [
      {
        extends: true,
        test: { name: "unit", include: ["tests/unit/**/*.test.ts"], environment: "node" },
      },
      {
        extends: true,
        test: {
          name: "integration",
          include: ["tests/integration/**/*.test.ts"],
          environment: "node",
          globalSetup: ["tests/integration/global-setup.ts"],
          env: {
            NODE_ENV: "test",
            DATABASE_URL:
              process.env.TEST_DATABASE_URL ?? "postgres://postgres@localhost:5432/booksync_test",
            BETTER_AUTH_SECRET: "test-secret-test-secret-test-secret-123",
            NEXT_PUBLIC_APP_URL: "http://localhost:3000",
            AUTH_RATE_LIMIT: "on",
            RESEND_API_KEY: "",
          },
          // Une seule base de test partagée : on exécute les fichiers séquentiellement.
          fileParallelism: false,
          testTimeout: 20_000,
          hookTimeout: 60_000,
        },
      },
    ],
  },
});
