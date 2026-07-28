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

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[AUTH_COOKIE_NAME];
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
