import { AuditLog } from "./audit-log.model.js";

// La auditoría solo recibe metadatos no sensibles. Nunca enviar passwords,
// tokens, cookies ni hashes en `metadata`.
export const recordAudit = async (event: string, values: { userId?: string | null; success?: boolean; ipAddress?: string | null; userAgent?: string | null; metadata?: Record<string, unknown> }): Promise<void> => {
  await AuditLog.create({ event, userId: values.userId ?? null, success: values.success ?? true, ipAddress: values.ipAddress ?? null, userAgent: values.userAgent ?? null, metadata: values.metadata ?? null });
};
