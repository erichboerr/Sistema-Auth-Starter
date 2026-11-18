import bcrypt from "bcrypt";
import request from "supertest";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { app } from "../../app.js";
import { sequelize } from "../../database/sequelize.js";
import { Role, Session, User } from "../../database/models.js";

// La prueba solo se ejecuta con `NODE_ENV=test`, para impedir que un comando
// normal de tests toque accidentalmente la base de desarrollo.
const runIntegrationTests = process.env.NODE_ENV === "test";

describe.skipIf(!runIntegrationTests)(
  "Flujo de autenticación con PostgreSQL",
  () => {
    const email = "integration-test@example.com";
    const password = "IntegrationPassword_123!";
    let agent: ReturnType<typeof request.agent>;
    let accessToken = "";
    let csrfToken = "";

    beforeAll(async () => {
      await sequelize.authenticate();
    });

    beforeEach(async () => {
      // El orden respeta las claves foráneas y deja cada test aislado.
      await Session.destroy({ where: {}, force: true });
      await User.destroy({ where: {}, force: true });
      await Role.destroy({ where: {}, force: true });

      const role = await Role.create({
        name: "admin",
        description: "Rol de prueba",
      });
      await User.create({
        email,
        passwordHash: await bcrypt.hash(password, 4),
        roleId: role.id,
        isActive: true,
      });
      agent = request.agent(app);
      const csrfResponse = await agent.get("/api/auth/csrf");
      const csrfCookie =
        (csrfResponse.headers["set-cookie"] as string[])[0] ?? "";
      csrfToken = /csrf_token=([^;]+)/.exec(csrfCookie)?.[1] ?? "";
      accessToken = "";
    });

    it("ejecuta login, refresh rotativo y logout", async () => {
      const loginResponse = await agent
        .post("/api/auth/login")
        .send({ email, password });
      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body.accessToken).toEqual(expect.any(String));
      expect(loginResponse.headers["set-cookie"]).toBeDefined();
      accessToken = loginResponse.body.accessToken as string;

      const sessionsResponse = await agent
        .get("/api/sessions")
        .set("Authorization", `Bearer ${accessToken}`);
      expect(sessionsResponse.status).toBe(200);
      expect(sessionsResponse.body.sessions).toHaveLength(1);

      const refreshResponse = await agent
        .post("/api/auth/refresh")
        .set("x-csrf-token", csrfToken)
        .send({});
      expect(refreshResponse.status).toBe(200);
      expect(refreshResponse.body.accessToken).toEqual(expect.any(String));

      const logoutResponse = await agent
        .post("/api/auth/logout")
        .set("x-csrf-token", csrfToken);
      expect(logoutResponse.status).toBe(204);

      const revokedResponse = await agent
        .get("/api/sessions")
        .set("Authorization", `Bearer ${accessToken}`);
      expect(revokedResponse.status).toBe(401);
    });

    it("rechaza credenciales incorrectas sin enumerar usuarios", async () => {
      const response = await agent
        .post("/api/auth/login")
        .send({ email, password: "incorrecta" });
      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe("INVALID_CREDENTIALS");
    });

    it("bloquea temporalmente la cuenta después de cinco intentos fallidos", async () => {
      for (let attempt = 0; attempt < 5; attempt += 1) {
        const response = await agent
          .post("/api/auth/login")
          .send({ email, password: "wrong-password" });
        expect(response.status).toBe(401);
      }
      const blocked = await agent
        .post("/api/auth/login")
        .send({ email, password });
      expect(blocked.status).toBe(423);
      expect(blocked.body.error.code).toBe("ACCOUNT_LOCKED");
    });

    it("rechaza usar la misma contraseña como contraseña nueva", async () => {
      const login = await agent
        .post("/api/auth/login")
        .send({ email, password });
      const response = await agent
        .post("/api/auth/change-password")
        .set("Authorization", `Bearer ${login.body.accessToken as string}`)
        .send({ currentPassword: password, newPassword: password });
      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });
  },
);
