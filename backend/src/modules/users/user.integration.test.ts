import bcrypt from "bcrypt";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { app } from "../../app.js";
import { Permission, Role, Session, User } from "../../database/models.js";

const enabled = process.env.NODE_ENV === "test";

describe.skipIf(!enabled)("ABM de usuarios", () => {
  let adminToken = "";
  let adminId = "";
  let roleId = "";

  beforeEach(async () => {
    await Session.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });
    await Role.destroy({ where: {}, force: true });
    const adminRole = await Role.create({
      name: "admin",
      description: "Administrador",
    });
    const userRole = await Role.create({
      name: "user",
      description: "Usuario",
    });
    const permissions = await Permission.findAll({
      where: {
        name: ["users:read", "users:create", "users:update", "users:delete"],
      },
    });
    await (
      adminRole as Role & {
        addPermissions: (items: Permission[]) => Promise<void>;
      }
    ).addPermissions(permissions);
    roleId = userRole.id;
    const admin = await User.create({
      email: "admin-abm@example.com",
      passwordHash: await bcrypt.hash("AdminPassword_123!", 4),
      roleId: adminRole.id,
      isActive: true,
    });
    adminId = admin.id;
    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin-abm@example.com", password: "AdminPassword_123!" });
    adminToken = response.body.accessToken as string;
  });

  it("crea, lista, actualiza y elimina lógicamente un usuario", async () => {
    const created = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        email: "new-user@example.com",
        password: "NewUserPassword_123!",
        roleId,
      });
    expect(created.status).toBe(201);
    expect(created.body.passwordHash).toBeUndefined();
    const userId = created.body.id as string;

    const listed = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(listed.status).toBe(200);
    expect(listed.body.total).toBe(2);

    const updated = await request(app)
      .patch(`/api/users/${userId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ isActive: false });
    expect(updated.status).toBe(200);
    expect(updated.body.isActive).toBe(false);

    const removed = await request(app)
      .delete(`/api/users/${userId}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(removed.status).toBe(204);
  });

  it("rechaza el ABM para un usuario sin rol admin", async () => {
    const user = await User.create({
      email: "regular@example.com",
      passwordHash: await bcrypt.hash("RegularPassword_123!", 4),
      roleId,
      isActive: true,
    });
    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: user.email, password: "RegularPassword_123!" });
    const response = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${login.body.accessToken as string}`);
    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("FORBIDDEN");
  });

  it("impide que el administrador se elimine a sí mismo", async () => {
    const response = await request(app)
      .delete(`/api/users/${adminId}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("SELF_DELETE_NOT_ALLOWED");
  });
});
