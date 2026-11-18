"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Se almacena el hash, nunca el refresh token en texto plano.
    await queryInterface.createTable("sessions", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      refreshTokenHash: { type: Sequelize.STRING(128), allowNull: false },
      previousTokenHash: { type: Sequelize.STRING(128), allowNull: true },
      expiresAt: { type: Sequelize.DATE, allowNull: false },
      lastUsedAt: { type: Sequelize.DATE, allowNull: true },
      revokedAt: { type: Sequelize.DATE, allowNull: true },
      userAgent: { type: Sequelize.STRING(512), allowNull: true },
      ipAddress: { type: Sequelize.STRING(64), allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex("sessions", ["userId"], {
      name: "sessions_user_id_idx",
    });
    await queryInterface.addIndex("sessions", ["refreshTokenHash"], {
      name: "sessions_refresh_token_hash_idx",
      unique: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("sessions");
  },
};
