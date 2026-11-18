"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // UUID evita exponer identificadores secuenciales públicamente.
    await queryInterface.createTable("users", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      email: { type: Sequelize.STRING(254), allowNull: false, unique: true },
      passwordHash: { type: Sequelize.STRING(255), allowNull: false },
      roleId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "roles", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
      deletedAt: { type: Sequelize.DATE, allowNull: true },
    });

    await queryInterface.addIndex("users", ["email"], {
      name: "users_email_idx",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("users");
  },
};
