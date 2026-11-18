import type { Request, Response, NextFunction } from "express";
import { AuditLog } from "../../database/models.js";

export const list = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);
    const where = req.query.event ? { event: String(req.query.event) } : {};
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
