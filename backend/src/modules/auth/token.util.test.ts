import { describe, expect, it } from "vitest";
import { createAccessToken, createRefreshToken, hashRefreshToken, verifyAccessToken } from "./token.util.js";

describe("Utilidades de tokens", () => {
  it("crea y verifica un access token con el payload esperado", () => {
    const token = createAccessToken({ sub: "user-id", sid: "session-id", role: "admin", type: "access" });
    const payload = verifyAccessToken(token);

    expect(payload.sub).toBe("user-id");
    expect(payload.sid).toBe("session-id");
    expect(payload.role).toBe("admin");
    expect(payload.type).toBe("access");
  });

  it("rechaza un token alterado", () => {
    const token = createAccessToken({ sub: "user-id", sid: "session-id", role: "admin", type: "access" });
    expect(() => verifyAccessToken(`${token}alterado`)).toThrow();
  });

  it("genera refresh tokens aleatorios y hashes deterministas", () => {
    const first = createRefreshToken();
    const second = createRefreshToken();

    expect(first).not.toBe(second);
    expect(hashRefreshToken(first)).toBe(hashRefreshToken(first));
    expect(hashRefreshToken(first)).not.toBe(hashRefreshToken(second));
    expect(hashRefreshToken(first)).not.toContain(first);
  });
});
