import { Op } from "sequelize";
import { AuditLog } from "../../database/models.js";

// La purga se ejecuta mediante un job externo o cron, nunca durante una
// request. Mantener AUDIT_RETENTION_DAYS fuera del código permite ajustarlo.
export const purgeAuditLogs = async (retentionDays: number): Promise<number> => {
  if (!Number.isInteger(retentionDays) || retentionDays < 30) throw new Error("La retención mínima es de 30 días");
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
  return AuditLog.destroy({ where: { createdAt: { [Op.lt]: cutoff } } });
};
