import type { Request, Response, NextFunction } from "express";
import * as service from "./user.service.js";

const audit = (req: Request) => ({
  ipAddress: req.ip ?? null,
  userAgent: req.get("user-agent") ?? null,
});
export const list = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    res.json(
      await service.list(
        Number(req.query.page) || 1,
        Number(req.query.limit) || 20,
      ),
    );
  } catch (e) {
    next(e);
  }
};
export const getById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    res.json(await service.getById(req.params.id as string));
  } catch (e) {
    next(e);
  }
};
export const create = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    res
      .status(201)
      .json(await service.create(req.body, req.auth!.sub, audit(req)));
  } catch (e) {
    next(e);
  }
};
export const update = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    res.json(
      await service.update(
        req.params.id as string,
        req.body,
        req.auth!.sub,
        audit(req),
      ),
    );
  } catch (e) {
    next(e);
  }
};
export const remove = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    await service.remove(req.params.id as string, req.auth!.sub, audit(req));
    res.status(204).send();
  } catch (e) {
    next(e);
  }
};
