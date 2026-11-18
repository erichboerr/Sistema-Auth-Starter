import type { RequestHandler } from "express";
import { AppError } from "../../shared/errors/app-error.js";
import { verifyAccessToken } from "./token.util.js";
import { Permission, Role, Session, User } from "../../database/models.js";

export const requireAccessToken: RequestHandler = async (req, _res, next) => {
  const header = req.get("authorization");
  if (!header?.startsWith("Bearer "))
    return next(
      new AppError(401, "Autenticación requerida", "AUTHENTICATION_REQUIRED"),
    );
  try {
    const payload = verifyAccessToken(header.slice(7));
    const session = await Session.findOne({
      where: { id: payload.sid, userId: payload.sub, revokedAt: null },
      include: [{ model: User, as: "user" }],
    });
    if (!session || session.expiresAt <= new Date() || !session.user?.isActive)
      throw new AppError(401, "Sesión inválida o revocada", "INVALID_SESSION");
    req.auth = payload;
    next();
  } catch (error) {
    next(
      error instanceof AppError
        ? error
        : new AppError(
            401,
            "Access token inválido o expirado",
            "INVALID_ACCESS_TOKEN",
          ),
    );
  }
};

// Autorización explícita por rol. La autenticación identifica al usuario;
// este middleware decide si puede ejecutar una operación administrativa.
export const requireRole =
  (...allowedRoles: string[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.auth || !allowedRoles.includes(req.auth.role))
      return next(new AppError(403, "Permisos insuficientes", "FORBIDDEN"));
    next();
  };

export const requirePermission =
  (name: string): RequestHandler =>
  async (req, _res, next) => {
    try {
      const user = await User.findByPk(req.auth!.sub);
      const role = user
        ? await Role.findByPk(user.roleId, {
            include: [
              {
                model: Permission,
                as: "permissions",
                where: { name },
                required: true,
              },
            ],
          })
        : null;
      if (!role) throw new AppError(403, "Permisos insuficientes", "FORBIDDEN");
      next();
    } catch (error) {
      next(
        error instanceof AppError
          ? error
          : new AppError(403, "Permisos insuficientes", "FORBIDDEN"),
      );
    }
  };
