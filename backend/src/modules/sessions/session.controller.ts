import type { Request, Response, NextFunction } from "express";
import * as sessionService from "./session.service.js";
import { AppError } from "../../shared/errors/app-error.js";

export const list = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    res.json({
      sessions: await sessionService.listActiveSessions(req.auth!.sub),
    });
  } catch (error) {
    next(error);
  }
};

export const revoke = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { sessionId } = req.params;
    if (!sessionId || Array.isArray(sessionId))
      throw new AppError(
        400,
        "Identificador de sesión inválido",
        "INVALID_SESSION_ID",
      );
    await sessionService.revokeSession(req.auth!.sub, sessionId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const revokeAll = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    await sessionService.revokeAllSessions(req.auth!.sub, req.auth!.sid);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
