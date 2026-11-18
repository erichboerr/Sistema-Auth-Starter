import { DataTypes, Model, type Sequelize } from "sequelize";
export class Permission extends Model {
  declare id: string;
  declare name: string;
  declare description: string | null;
}
export const initPermissionModel = (
  sequelize: Sequelize,
): typeof Permission => {
  Permission.init(
    {
      id: { type: DataTypes.UUID, primaryKey: true },
      name: { type: DataTypes.STRING(100), allowNull: false, unique: true },
      description: { type: DataTypes.STRING(255) },
    },
    { sequelize, tableName: "permissions", timestamps: true },
  );
  return Permission;
};
