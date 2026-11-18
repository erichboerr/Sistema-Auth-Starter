import { DataTypes, Model, type Sequelize } from "sequelize";

export class Role extends Model {
  declare id: string;
  declare name: string;
  declare description: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export const initRoleModel = (sequelize: Sequelize): typeof Role => {
  Role.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING(80), allowNull: false, unique: true },
    description: { type: DataTypes.STRING(255), allowNull: true },
  }, { sequelize, tableName: "roles", timestamps: true });
  return Role;
};
