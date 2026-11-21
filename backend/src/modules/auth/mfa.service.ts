import { generateSecret, generateURI, verify } from "otplib";
import { User, Session } from "../../database/models.js";
import { AppError } from "../../shared/errors/app-error.js";
import { encryptMfaSecret } from "../../shared/security/mfa.crypto.js";
import bcrypt from "bcrypt";
import { randomBytes } from "node:crypto";

const createRecoveryCodes = (): string[] => Array.from({ length: 10 }, () => `${randomBytes(4).toString("hex").toUpperCase()}-${randomBytes(4).toString("hex").toUpperCase()}`);

export const setup = async (userId: string) => {
  const user = await User.findByPk(userId);
  if (!user) throw new AppError(404, "Usuario no encontrado", "USER_NOT_FOUND");
  const secret = generateSecret();
  const recoveryCodes = createRecoveryCodes();
  await user.update({
    mfaSecretEncrypted: encryptMfaSecret(secret),
    mfaEnabled: false,
    mfaRecoveryCodesHash: await Promise.all(recoveryCodes.map((code) => bcrypt.hash(code, 12))),
  });
  return {
    secret,
    otpauthUrl: generateURI({
      issuer: "Sistema Auth Starter",
      label: user.email,
      secret,
    }),
    recoveryCodes,
  };
};
export const enable = async (userId: string, code: string) => {
  const user = await User.findByPk(userId);
  if (!user?.mfaSecretEncrypted)
    throw new AppError(400, "MFA no configurado", "MFA_NOT_CONFIGURED");
  if (
    !(await verify({
      token: code,
      secret: (
        await import("../../shared/security/mfa.crypto.js")
      ).decryptMfaSecret(user.mfaSecretEncrypted),
    }))
  )
    throw new AppError(400, "Código MFA inválido", "INVALID_MFA_CODE");
  await user.update({ mfaEnabled: true });
  await Session.update(
    { revokedAt: new Date() },
    { where: { userId, revokedAt: null } },
  );
};
export const disable = async (userId: string) => {
  const user = await User.findByPk(userId);
  if (!user) throw new AppError(404, "Usuario no encontrado", "USER_NOT_FOUND");
  await user.update({ mfaEnabled: false, mfaSecretEncrypted: null });
  await Session.update(
    { revokedAt: new Date() },
    { where: { userId, revokedAt: null } },
  );
};
