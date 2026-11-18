"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("audit_logs", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      event: { type: Sequelize.STRING(80), allowNull: false },
      success: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      ipAddress: { type: Sequelize.STRING(64), allowNull: true },
      userAgent: { type: Sequelize.STRING(512), allowNull: true },
      metadata: { type: Sequelize.JSONB, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex("audit_logs", ["userId", "createdAt"], {
      name: "audit_logs_user_created_idx",
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable("audit_logs");
  },
};
