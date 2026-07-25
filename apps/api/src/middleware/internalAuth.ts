import { timingSafeEqual } from "node:crypto";
import type { FastifyReply, FastifyRequest } from "fastify";

import { env } from "../config/env.js";

export async function requireInternalSecret(request: FastifyRequest, reply: FastifyReply) {
  const provided = request.headers["x-internal-secret"];

  if (typeof provided !== "string") {
    return reply.unauthorized("Missing internal secret");
  }

  const expected = Buffer.from(env.INTERNAL_API_SECRET);
  const actual = Buffer.from(provided);

  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return reply.unauthorized("Invalid internal secret");
  }
}
