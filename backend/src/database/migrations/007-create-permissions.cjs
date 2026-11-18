"use strict";
const { randomUUID } = require("node:crypto");
module.exports = {
  async up(q, S) {
    await q.createTable("permissions", {
      id: { type: S.UUID, primaryKey: true },
      name: { type: S.STRING(100), allowNull: false, unique: true },
      description: { type: S.STRING(255) },
      createdAt: { type: S.DATE, allowNull: false },
      updatedAt: { type: S.DATE, allowNull: false },
    });
    await q.createTable("role_permissions", {
      roleId: {
        type: S.UUID,
        allowNull: false,
        references: { model: "roles", key: "id" },
        onDelete: "CASCADE",
      },
      permissionId: {
        type: S.UUID,
        allowNull: false,
        references: { model: "permissions", key: "id" },
        onDelete: "CASCADE",
      },
      createdAt: { type: S.DATE, allowNull: false },
      updatedAt: { type: S.DATE, allowNull: false },
    });
    const now = new Date();
    const ps = [
      "users:read",
      "users:create",
      "users:update",
      "users:delete",
      "audit:read",
    ].map((name) => ({
      id: randomUUID(),
      name,
      description: `Permiso ${name}`,
      createdAt: now,
      updatedAt: now,
    }));
    await q.bulkInsert("permissions", ps);
    const [roles] = await q.sequelize.query(
      "SELECT id FROM roles WHERE name='admin' LIMIT 1",
    );
    if (roles.length)
      await q.bulkInsert(
        "role_permissions",
        ps.map((p) => ({
          roleId: roles[0].id,
          permissionId: p.id,
          createdAt: now,
          updatedAt: now,
        })),
      );
  },
  async down(q) {
    await q.dropTable("role_permissions");
    await q.dropTable("permissions");
  },
};
