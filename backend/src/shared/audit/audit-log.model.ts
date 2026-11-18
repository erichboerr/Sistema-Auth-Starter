import { DataTypes, Model, type Sequelize } from "sequelize";

export class AuditLog extends Model {
  declare id: string;
  declare userId: string | null;
  declare event: string;
  declare success: boolean;
  declare ipAddress: string | null;
  declare userAgent: string | null;
  declare metadata: Record<string, unknown> | null;
  declare readonly createdAt: Date;
}

export const initAuditLogModel = (sequelize: Sequelize): typeof AuditLog => {
  AuditLog.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: { type: DataTypes.UUID, allowNull: true },
      event: { type: DataTypes.STRING(80), allowNull: false },
      success: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      ipAddress: { type: DataTypes.STRING(64), allowNull: true },
      userAgent: { type: DataTypes.STRING(512), allowNull: true },
      metadata: { type: DataTypes.JSONB, allowNull: true },
    },
    { sequelize, tableName: "audit_logs", timestamps: true, updatedAt: false },
  );
  return AuditLog;
};
