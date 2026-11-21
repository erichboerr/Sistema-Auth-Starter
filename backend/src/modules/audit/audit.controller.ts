import type { Request, Response, NextFunction } from "express";
import { AuditLog } from "../../database/models.js";
import { Op } from "sequelize";
import { AppError } from "../../shared/errors/app-error.js";

export const list = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);
    const where: Record<string, unknown> = {};
    if (req.query.event) where.event = String(req.query.event);
    if (req.query.userId) where.userId = String(req.query.userId);
    const from = req.query.from ? new Date(String(req.query.from)) : null;
    const to = req.query.to ? new Date(String(req.query.to)) : null;
    if ((from && Number.isNaN(from.valueOf())) || (to && Number.isNaN(to.valueOf()))) return next(new AppError(400, "Rango de fechas inválido", "INVALID_DATE_RANGE"));
    if (from || to) where.createdAt = { ...(from ? { [Op.gte]: from } : {}), ...(to ? { [Op.lte]: to } : {}) };
    const result = await AuditLog.findAndCountAll({
      where,
      limit,
      offset: (page - 1) * limit,
      order: [["createdAt", "DESC"]],
      attributes: { exclude: ["metadata"] },
    });
    res.json({ items: result.rows, total: result.count, page, limit });
  } catch (error) {
    next(error);
  }
};
