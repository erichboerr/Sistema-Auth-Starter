import { createHash, timingSafeEqual } from "node:crypto";
import type { RequestHandler } from "express";
import { AppError } from "../errors/app-error.js";

// Double-submit cookie: el frontend lee csrf_token y lo repite en el header.
// El refresh token permanece HttpOnly y nunca queda accesible a JavaScript.
export const requireCsrfHeader: RequestHandler = (req, _res, next) => {
  const cookieToken = req.cookies.csrf_token as string | undefined;
  const headerToken = req.get("x-csrf-token");
  if (!cookieToken || !headerToken) return next(new AppError(403, "Token CSRF requerido", "CSRF_REQUIRED"));
  const cookieDigest = createHash("sha256").update(cookieToken).digest();
  const headerDigest = createHash("sha256").update(headerToken).digest();
  if (!timingSafeEqual(cookieDigest, headerDigest)) return next(new AppError(403, "Token CSRF inválido", "CSRF_INVALID"));
  next();
};
