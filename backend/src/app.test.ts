import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "./app.js";

describe("HTTP base de la aplicación", () => {
  it("expone el health check", async () => {
    const response = await request(app).get("/health");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok", service: "sistema-auth-starter" });
  });

  it("responde un error JSON consistente para rutas inexistentes", async () => {
    const response = await request(app).get("/ruta-inexistente");
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("NOT_FOUND");
  });
});
