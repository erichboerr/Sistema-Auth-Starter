import "../config/env.js";
import { sequelize } from "../database/sequelize.js";
import "../database/models.js";
import { purgeAuditLogs } from "../modules/audit/audit.retention.js";

const retentionDays = Number(process.env.AUDIT_RETENTION_DAYS ?? 365);
const main = async (): Promise<void> => { try { await sequelize.authenticate(); const deleted = await purgeAuditLogs(retentionDays); console.log(`Eventos de auditoría eliminados: ${deleted}`); } finally { await sequelize.close(); } };
main().catch((error: unknown) => { console.error(error); process.exitCode = 1; });
