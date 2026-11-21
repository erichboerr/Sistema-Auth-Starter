import bcrypt from "bcrypt";
import { AppError } from "../../shared/errors/app-error.js";
import { logger } from "../../shared/logger/logger.js";
import { Session } from "../../database/models.js";
import { User } from "../../database/models.js";
import { recordAudit } from "../../shared/audit/audit-log.service.js";
import {
  assertPasswordNotReused,
  hashPassword,
  savePasswordHistory,
} from "../../shared/security/password.service.js";
import { verify } from "otplib";
import { decryptMfaSecret } from "../../shared/security/mfa.crypto.js";
import {
  createAccessToken,
  createRefreshToken,
  hashRefreshToken,
} from "./token.util.js";
import {
  createSession,
  findSessionByTokenHash,
  findUserByEmail,
} from "./auth.repository.js";
import type { LoginInput } from "./auth.types.js";

const refreshLifetimeMs = 7 * 24 * 60 * 60 * 1000;
const maxFailedAttempts = 5;
const lockoutDurationMs = 15 * 60 * 1000;

export const login = async (
  input: LoginInput,
  metadata: { userAgent: string | null; ipAddress: string | null },
) => {
  const user = await findUserByEmail(input.email.trim().toLowerCase());
  const isLocked = user && user.lockedUntil && user.lockedUntil > new Date();
  if (user && isLocked) {
    await recordAudit("account_locked_login_attempt", {
      userId: user.id,
      success: false,
      ...metadata,
    });
    throw new AppError(423, "Cuenta bloqueada temporalmente", "ACCOUNT_LOCKED");
  }
  if (
    !user ||
    !user.isActive ||
    !(await bcrypt.compare(input.password, user.passwordHash))
  ) {
    // El mensaje único evita enumerar usuarios válidos.
    if (user) {
      const attempts = user.failedLoginAttempts + 1;
      const shouldLock = attempts >= maxFailedAttempts;
      await user.update({
        failedLoginAttempts: shouldLock ? 0 : attempts,
        lockedUntil: shouldLock
          ? new Date(Date.now() + lockoutDurationMs)
          : null,
      });
      if (shouldLock)
        await recordAudit("account_locked", {
          userId: user.id,
          success: false,
          ...metadata,
          metadata: { durationMinutes: 15 },
        });
    }
    await recordAudit("login", {
      userId: user?.id ?? null,
      success: false,
      ...metadata,
    });
    throw new AppError(401, "Credenciales inválidas", "INVALID_CREDENTIALS");
  }
  if (user.mfaEnabled) {
    let mfaValid = Boolean(input.mfaCode && user.mfaSecretEncrypted && await verify({ token: input.mfaCode, secret: decryptMfaSecret(user.mfaSecretEncrypted) }));
    if (!mfaValid && input.recoveryCode) {
      const hashes = [...(user.mfaRecoveryCodesHash ?? [])];
      const index = await Promise.all(hashes.map((hash) => bcrypt.compare(input.recoveryCode!, hash))).then((matches) => matches.findIndex(Boolean));
      if (index >= 0) { hashes.splice(index, 1); await user.update({ mfaRecoveryCodesHash: hashes }); mfaValid = true; }
    }
    if (!mfaValid)
      throw new AppError(
        401,
        "Código MFA requerido o inválido",
        "MFA_REQUIRED",
      );
  }
  await user.update({ failedLoginAttempts: 0, lockedUntil: null });
  const refreshToken = createRefreshToken();
  const session = await createSession({
    userId: user.id,
    refreshTokenHash: hashRefreshToken(refreshToken),
    expiresAt: new Date(Date.now() + refreshLifetimeMs),
    ...metadata,
  });
  const accessToken = createAccessToken({
    sub: user.id,
    sid: session.id,
    role: user.role?.name ?? "user",
    type: "access",
  });
  logger.info({
    event: "login_success",
    userId: user.id,
    sessionId: session.id,
  });
  await recordAudit("login", {
    userId: user.id,
    success: true,
    ...metadata,
    metadata: { sessionId: session.id },
  });
  return {
    accessToken,
    refreshToken,
    sessionId: session.id,
    user: { id: user.id, email: user.email, roleId: user.roleId },
  };
};

export const refresh = async (
  token: string,
  metadata: { userAgent: string | null; ipAddress: string | null },
) => {
  const hash = hashRefreshToken(token);
  const session = await findSessionByTokenHash(hash);
  if (!session || session.revokedAt || session.expiresAt <= new Date()) {
    await recordAudit("refresh", {
      userId: session?.userId ?? null,
      success: false,
      ...metadata,
    });
    throw new AppError(
      401,
      "Refresh token inválido o expirado",
      "INVALID_REFRESH_TOKEN",
    );
  }
  if (session.previousTokenHash === hash) {
    await Session.update(
      { revokedAt: new Date() },
      { where: { id: session.id } },
    );
    await recordAudit("refresh_reuse", {
      userId: session.userId,
      success: false,
      ...metadata,
      metadata: { sessionId: session.id },
    });
    throw new AppError(401, "Refresh token reutilizado", "REFRESH_TOKEN_REUSE");
  }
  const nextToken = createRefreshToken();
  await session.update({
    previousTokenHash: session.refreshTokenHash,
    refreshTokenHash: hashRefreshToken(nextToken),
    lastUsedAt: new Date(),
    ...metadata,
  });
  const role = session.user?.role?.name ?? "user";
  const accessToken = createAccessToken({
    sub: session.userId,
    sid: session.id,
    role,
    type: "access",
  });
  logger.info({
    event: "refresh_success",
    sessionId: session.id,
    userId: session.userId,
  });
  await recordAudit("refresh", {
    userId: session.userId,
    success: true,
    ...metadata,
    metadata: { sessionId: session.id },
  });
  return { accessToken, refreshToken: nextToken };
};

export const logout = async (token: string): Promise<void> => {
  const session = await findSessionByTokenHash(hashRefreshToken(token));
  if (session && !session.revokedAt) {
    await session.update({ revokedAt: new Date() });
    await recordAudit("logout", {
      userId: session.userId,
      success: true,
      metadata: { sessionId: session.id },
    });
  }
};

export const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string,
  metadata: { ipAddress: string | null; userAgent: string | null },
): Promise<void> => {
  const user = await User.findByPk(userId);
  if (
    !user ||
    !user.isActive ||
    !(await bcrypt.compare(currentPassword, user.passwordHash))
  ) {
    await recordAudit("password_change", {
      userId,
      success: false,
      ...metadata,
    });
    throw new AppError(
      401,
      "Contraseña actual inválida",
      "INVALID_CURRENT_PASSWORD",
    );
  }
  await assertPasswordNotReused(userId, newPassword, user.passwordHash);
  const newHash = await hashPassword(newPassword);
  await user.update({ passwordHash: newHash });
  await savePasswordHistory(userId, newHash);
  await Session.update(
    { revokedAt: new Date() },
    { where: { userId, revokedAt: null } },
  );
  await recordAudit("password_change", { userId, success: true, ...metadata });
};
