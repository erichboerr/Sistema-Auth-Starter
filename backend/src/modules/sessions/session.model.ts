import { DataTypes, Model, type Sequelize } from "sequelize";
import type { User } from "../users/user.model.js";

export class Session extends Model {
  declare id: string;
  declare userId: string;
  declare refreshTokenHash: string;
  declare previousTokenHash: string | null;
  declare expiresAt: Date;
  declare lastUsedAt: Date | null;
  declare revokedAt: Date | null;
  declare userAgent: string | null;
  declare ipAddress: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare user?: User;
}

export const initSessionModel = (sequelize: Sequelize): typeof Session => {
  Session.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: false },
    refreshTokenHash: { type: DataTypes.STRING(128), allowNull: false, unique: true },
    previousTokenHash: { type: DataTypes.STRING(128), allowNull: true },
    expiresAt: { type: DataTypes.DATE, allowNull: false },
    lastUsedAt: { type: DataTypes.DATE, allowNull: true },
    revokedAt: { type: DataTypes.DATE, allowNull: true },
    userAgent: { type: DataTypes.STRING(512), allowNull: true },
    ipAddress: { type: DataTypes.STRING(64), allowNull: true },
  }, { sequelize, tableName: "sessions", timestamps: true });
  return Session;
};
