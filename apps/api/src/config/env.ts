import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  CLERK_SECRET_KEY: z.string().min(1, "CLERK_SECRET_KEY is required"),
  CORS_ORIGIN: z.string().default("*"),

  REDIS_URL: z.string().min(1, "REDIS_URL is required"),

  R2_ACCOUNT_ID: z.string().min(1, "R2_ACCOUNT_ID is required"),
  R2_ACCESS_KEY_ID: z.string().min(1, "R2_ACCESS_KEY_ID is required"),
  R2_SECRET_ACCESS_KEY: z.string().min(1, "R2_SECRET_ACCESS_KEY is required"),
  R2_BUCKET_NAME: z.string().min(1, "R2_BUCKET_NAME is required"),

  INTERNAL_API_SECRET: z.string().min(16, "INTERNAL_API_SECRET must be at least 16 characters"),

  MAX_UPLOAD_MINUTES_HARD_CAP: z.coerce.number().default(180),
});

export const env = envSchema.parse(process.env);
