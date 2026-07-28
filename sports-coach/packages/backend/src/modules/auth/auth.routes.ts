import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { env } from "../../lib/env.js";
import { requireAuth } from "../../middleware/auth.js";
import { authRateLimiter } from "../../lib/rate-limit.js";
import { toUserProfileDTO } from "../users/users.mapper.js";
import {
  AUTH_COOKIE_MAX_AGE_MS,
  AUTH_COOKIE_NAME,
  hashPassword,
  signSessionToken,
  verifyPassword,
} from "./auth.service.js";

export const authRouter = Router();
authRouter.use(["/register", "/login"], authRateLimiter);

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caracteres"),
});

function setSessionCookie(res: import("express").Response, token: string) {
  res.cookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.nodeEnv === "production",
    maxAge: AUTH_COOKIE_MAX_AGE_MS,
  });
}

authRouter.post("/register", async (req, res) => {
  const parsed = credentialsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Requete invalide" });
    return;
  }
  const { email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ error: "Un compte existe deja avec cet email" });
    return;
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { email, passwordHash },
  });

  const token = signSessionToken(user.id);
  setSessionCookie(res, token);
  res.status(201).json({ user: toUserProfileDTO(user) });
});

authRouter.post("/login", async (req, res) => {
  const parsed = credentialsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Email ou mot de passe invalide" });
    return;
  }
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    res.status(401).json({ error: "Email ou mot de passe incorrect" });
    return;
  }

  const token = signSessionToken(user.id);
  setSessionCookie(res, token);
  res.json({ user: toUserProfileDTO(user) });
});

authRouter.post("/logout", (_req, res) => {
  res.clearCookie(AUTH_COOKIE_NAME);
  res.status(204).send();
});

authRouter.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) {
    res.status(404).json({ error: "Utilisateur introuvable" });
    return;
  }
  res.json({ user: toUserProfileDTO(user) });
});
