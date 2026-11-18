import { Router } from "express";
import { requireAccessToken, requirePermission } from "../auth/auth.middleware.js";
import { validateBody } from "../../shared/middleware/validate.js";
import { createUserSchema, updateUserSchema } from "./user.schemas.js";
import * as controller from "./user.controller.js";

export const userRouter = Router();
userRouter.use(requireAccessToken);
userRouter.get("/", requirePermission("users:read"), controller.list);
userRouter.post("/", requirePermission("users:create"), validateBody(createUserSchema), controller.create);
userRouter.get("/:id", requirePermission("users:read"), controller.getById);
userRouter.patch("/:id", requirePermission("users:update"), validateBody(updateUserSchema), controller.update);
userRouter.delete("/:id", requirePermission("users:delete"), controller.remove);
