"use strict";
module.exports = {
  async up(q, S) {
    await q.createTable("password_history", {
      id: { type: S.UUID, defaultValue: S.UUIDV4, primaryKey: true },
      userId: {
        type: S.UUID,
        allowNull: false,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
      },
      passwordHash: { type: S.STRING(255), allowNull: false },
      createdAt: { type: S.DATE, allowNull: false },
    });
  },
  async down(q) {
    await q.dropTable("password_history");
  },
};
