import { createHash, randomBytes } from "node:crypto";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import type { AccessTokenPayload } from "./auth.types.js";

// El refresh token es aleatorio y opaco: no contiene información del usuario.
export const createRefreshToken = (): string =>
  randomBytes(64).toString("base64url");

// Solo se persiste este digest; si la base se filtra, el token original no queda expuesto.
export const hashRefreshToken = (token: string): string =>
  createHash("sha256").update(token).digest("hex");

export const createAccessToken = (payload: AccessTokenPayload): string =>
  jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as NonNullable<
      jwt.SignOptions["expiresIn"]
    >,
  });

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  const payload = jwt.verify(token, env.JWT_ACCESS_SECRET);
  if (
    typeof payload !== "object" ||
    payload.type !== "access" ||
    typeof payload.sub !== "string" ||
    typeof payload.sid !== "string" ||
    typeof payload.role !== "string"
  ) {
    throw new Error("Access token inválido");
  }
  return payload as AccessTokenPayload;
};
