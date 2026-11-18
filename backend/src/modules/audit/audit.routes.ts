import { Router } from "express";
import { requireAccessToken, requirePermission } from "../auth/auth.middleware.js";
import { list } from "./audit.controller.js";

export const auditRouter = Router();
auditRouter.use(requireAccessToken, requirePermission("audit:read"));
auditRouter.get("/", list);
