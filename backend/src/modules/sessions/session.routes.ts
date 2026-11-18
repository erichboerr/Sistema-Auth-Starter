import { Router } from "express";
import { requireAccessToken } from "../auth/auth.middleware.js";
import { list, revoke, revokeAll } from "./session.controller.js";

export const sessionRouter = Router();
sessionRouter.use(requireAccessToken);
sessionRouter.get("/", list);
sessionRouter.delete("/all", revokeAll);
sessionRouter.delete("/:sessionId", revoke);
