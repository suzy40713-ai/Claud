import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../../lib/env.js";

const SALT_ROUNDS = 12;
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signSessionToken(userId: string): string {
  return jwt.sign({ sub: userId }, env.jwtSecret, { expiresIn: TOKEN_TTL_SECONDS });
}

export function verifySessionToken(token: string): { sub: string } {
  return jwt.verify(token, env.jwtSecret) as { sub: string };
}

export const AUTH_COOKIE_NAME = "sc_session";
export const AUTH_COOKIE_MAX_AGE_MS = TOKEN_TTL_SECONDS * 1000;
