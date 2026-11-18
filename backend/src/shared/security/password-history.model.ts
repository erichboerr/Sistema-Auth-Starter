import { DataTypes, Model, type Sequelize } from "sequelize";
export class PasswordHistory extends Model {
  declare id: string;
  declare userId: string;
  declare passwordHash: string;
  declare readonly createdAt: Date;
}
export const initPasswordHistoryModel = (
  sequelize: Sequelize,
): typeof PasswordHistory => {
  PasswordHistory.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: { type: DataTypes.UUID, allowNull: false },
      passwordHash: { type: DataTypes.STRING(255), allowNull: false },
    },
    {
      sequelize,
      tableName: "password_history",
      timestamps: true,
      updatedAt: false,
    },
  );
  return PasswordHistory;
};
