import type { NextFunction, Request, Response } from "express";
import { AUTH_COOKIE_NAME, verifySessionToken } from "../modules/auth/auth.service.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

function extractToken(req: Request): string | undefined {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice("Bearer ".length);
  }
  return req.cookies?.[AUTH_COOKIE_NAME];
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  // Le cookie de session ne fonctionne pas de maniere fiable en cross-site
  // sur Safari/iOS (Intelligent Tracking Prevention bloque les cookies
  // SameSite=None meme correctement configures). Le header Authorization
  // est verifie en priorite, le cookie reste un filet de secours pour les
  // clients qui ne l'envoient pas explicitement.
  const token = extractToken(req);
  if (!token) {
    res.status(401).json({ error: "Non authentifie" });
    return;
  }

  try {
    const payload = verifySessionToken(token);
    req.userId = payload.sub;
    next();
  } catch {
    res.status(401).json({ error: "Session invalide ou expiree" });
  }
}
