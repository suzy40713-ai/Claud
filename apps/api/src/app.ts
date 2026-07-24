import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import sensible from "@fastify/sensible";
import Fastify from "fastify";

import { env } from "./config/env.js";
import { healthRoutes } from "./routes/health.js";
import { userRoutes } from "./routes/users.js";

export function buildApp() {
  const app = Fastify({
    logger:
      env.NODE_ENV === "development"
        ? { transport: { target: "pino-pretty" } }
        : true,
  });

  app.register(sensible);
  app.register(cors, { origin: env.CORS_ORIGIN });
  app.register(rateLimit, { max: 100, timeWindow: "1 minute" });

  app.register(healthRoutes);
  app.register(userRoutes, { prefix: "/api" });

  return app;
}
