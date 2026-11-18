import { DataTypes, Model, type Sequelize } from "sequelize";
import type { Role } from "../roles/role.model.js";

export class User extends Model {
  declare id: string;
  declare email: string;
  declare passwordHash: string;
  declare roleId: string;
  declare isActive: boolean;
  declare failedLoginAttempts: number;
  declare lockedUntil: Date | null;
  declare mfaEnabled: boolean;
  declare mfaSecretEncrypted: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare readonly deletedAt: Date | null;
  declare role?: Role;
}

export const initUserModel = (sequelize: Sequelize): typeof User => {
  User.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      email: { type: DataTypes.STRING(254), allowNull: false, unique: true },
      passwordHash: { type: DataTypes.STRING(255), allowNull: false },
      roleId: { type: DataTypes.UUID, allowNull: false },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      failedLoginAttempts: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      lockedUntil: { type: DataTypes.DATE, allowNull: true },
      mfaEnabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      mfaSecretEncrypted: { type: DataTypes.TEXT, allowNull: true },
    },
    { sequelize, tableName: "users", timestamps: true, paranoid: true },
  );
  return User;
};
