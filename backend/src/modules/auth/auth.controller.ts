import type { Request, Response, NextFunction } from "express";
import { env } from "../../config/env.js";
import { AppError } from "../../shared/errors/app-error.js";
import * as authService from "./auth.service.js";
import * as mfaService from "./mfa.service.js";
import { randomBytes } from "node:crypto";

const cookieOptions = {
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  sameSite: env.COOKIE_SAME_SITE as "lax" | "strict" | "none",
  path: "/api/auth" as const,
};
const setRefreshCookie = (res: Response, token: string): void => { res.cookie("refresh_token", token, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 }); };
const csrfCookieOptions = { httpOnly: false, secure: env.COOKIE_SECURE, sameSite: env.COOKIE_SAME_SITE as "lax" | "strict" | "none", path: "/api/auth" as const };

export const csrf = (_req: Request, res: Response): void => {
  res.cookie("csrf_token", randomBytes(32).toString("base64url"), { ...csrfCookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });
  res.status(204).send();
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try { const result = await authService.login(req.body, { userAgent: req.get("user-agent") ?? null, ipAddress: req.ip ?? null }); setRefreshCookie(res, result.refreshToken); res.status(200).json({ accessToken: result.accessToken, user: result.user }); } catch (error) { next(error); }
};

export const refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.cookies.refresh_token as string | undefined;
    // Una cookie ausente es un problema de autenticación del cliente, no un
    // error interno. Esto también evita pasar undefined a la función de hash.
    if (!token) throw new AppError(401, "Refresh token no proporcionado", "REFRESH_TOKEN_REQUIRED");
    const result = await authService.refresh(token, { userAgent: req.get("user-agent") ?? null, ipAddress: req.ip ?? null });
    setRefreshCookie(res, result.refreshToken);
    res.status(200).json({ accessToken: result.accessToken });
  } catch (error) { next(error); }
};

export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try { if (req.cookies.refresh_token) await authService.logout(req.cookies.refresh_token); res.clearCookie("refresh_token", cookieOptions); res.status(204).send(); } catch (error) { next(error); }
};

export const changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await authService.changePassword(req.auth!.sub, req.body.currentPassword, req.body.newPassword, { ipAddress: req.ip ?? null, userAgent: req.get("user-agent") ?? null });
    res.status(200).json({ message: "Contraseña actualizada correctamente. Todas las sesiones fueron revocadas." });
  } catch (error) { next(error); }
};
export const mfaSetup = async (req: Request, res: Response, next: NextFunction): Promise<void> => { try { res.json(await mfaService.setup(req.auth!.sub)); } catch(e){next(e);} };
export const mfaEnable = async (req: Request, res: Response, next: NextFunction): Promise<void> => { try { await mfaService.enable(req.auth!.sub, req.body.code); res.status(200).json({message:"MFA activado correctamente"}); } catch(e){next(e);} };
export const mfaDisable = async (req: Request, res: Response, next: NextFunction): Promise<void> => { try { await mfaService.disable(req.auth!.sub); res.status(200).json({message:"MFA desactivado correctamente"}); } catch(e){next(e);} };
