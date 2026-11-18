import { Op } from "sequelize";
import { AppError } from "../../shared/errors/app-error.js";
import { Session } from "../../database/models.js";
import { recordAudit } from "../../shared/audit/audit-log.service.js";

export const listActiveSessions = async (userId: string) =>
  Session.findAll({
    where: { userId, revokedAt: null, expiresAt: { [Op.gt]: new Date() } },
    attributes: [
      "id",
      "createdAt",
      "lastUsedAt",
      "expiresAt",
      "userAgent",
      "ipAddress",
    ],
    order: [["createdAt", "DESC"]],
    raw: true,
  });

export const revokeSession = async (
  userId: string,
  sessionId: string,
): Promise<void> => {
  const [updated] = await Session.update(
    { revokedAt: new Date() },
    { where: { id: sessionId, userId, revokedAt: null } },
  );
  if (!updated)
    throw new AppError(404, "Sesión no encontrada", "SESSION_NOT_FOUND");
  await recordAudit("session_revoked", {
    userId,
    success: true,
    metadata: { sessionId },
  });
};

export const revokeAllSessions = async (
  userId: string,
  currentSessionId?: string,
): Promise<void> => {
  const where = currentSessionId
    ? { userId, revokedAt: null, id: { [Op.ne]: currentSessionId } }
    : { userId, revokedAt: null };
  await Session.update({ revokedAt: new Date() }, { where });
  await recordAudit("sessions_revoked_all", {
    userId,
    success: true,
    metadata: { excludedSessionId: currentSessionId ?? null },
  });
};
