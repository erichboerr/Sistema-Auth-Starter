import bcrypt from "bcrypt";
import { Op } from "sequelize";
import { AppError } from "../../shared/errors/app-error.js";
import { recordAudit } from "../../shared/audit/audit-log.service.js";
import { Role, Session, User } from "../../database/models.js";
import {
  assertPasswordNotReused,
  hashPassword,
  savePasswordHistory,
} from "../../shared/security/password.service.js";

const userAttributes = { exclude: ["passwordHash", "deletedAt"] };
const metadata = (ipAddress: string | null, userAgent: string | null) => ({
  ipAddress,
  userAgent,
});

export const list = async (page = 1, limit = 20) => {
  const safeLimit = Math.min(Math.max(limit, 1), 100);
  const result = await User.findAndCountAll({
    where: {},
    attributes: userAttributes,
    include: [{ model: Role, as: "role", attributes: ["id", "name"] }],
    limit: safeLimit,
    offset: (page - 1) * safeLimit,
    order: [["createdAt", "DESC"]],
    distinct: true,
  });
  return { items: result.rows, total: result.count, page, limit: safeLimit };
};

export const getById = async (id: string) => {
  const user = await User.findByPk(id, {
    attributes: userAttributes,
    include: [{ model: Role, as: "role", attributes: ["id", "name"] }],
  });
  if (!user) throw new AppError(404, "Usuario no encontrado", "USER_NOT_FOUND");
  return user;
};

export const create = async (
  input: { email: string; password: string; roleId: string },
  actorId: string,
  audit: { ipAddress: string | null; userAgent: string | null },
) => {
  const email = input.email.trim().toLowerCase();
  if (await User.findOne({ where: { email }, paranoid: false }))
    throw new AppError(
      409,
      "El email ya está registrado",
      "EMAIL_ALREADY_EXISTS",
    );
  if (!(await Role.findByPk(input.roleId)))
    throw new AppError(400, "Rol no encontrado", "ROLE_NOT_FOUND");
  const passwordHash = await hashPassword(input.password);
  const user = await User.create({
    email,
    passwordHash,
    roleId: input.roleId,
    isActive: true,
  });
  await savePasswordHistory(user.id, passwordHash);
  await recordAudit("user_created", {
    userId: actorId,
    ...metadata(audit.ipAddress, audit.userAgent),
    metadata: { targetUserId: user.id },
  });
  return getById(user.id);
};

export const update = async (
  id: string,
  input: {
    email?: string;
    roleId?: string;
    isActive?: boolean;
    password?: string;
  },
  actorId: string,
  audit: { ipAddress: string | null; userAgent: string | null },
) => {
  const user = await User.findByPk(id);
  if (!user) throw new AppError(404, "Usuario no encontrado", "USER_NOT_FOUND");
  const values: {
    email?: string;
    roleId?: string;
    isActive?: boolean;
    passwordHash?: string;
  } = {};
  if (input.email) values.email = input.email.trim().toLowerCase();
  if (input.roleId) {
    if (!(await Role.findByPk(input.roleId)))
      throw new AppError(400, "Rol no encontrado", "ROLE_NOT_FOUND");
    values.roleId = input.roleId;
  }
  if (typeof input.isActive === "boolean") values.isActive = input.isActive;
  if (input.password) {
    await assertPasswordNotReused(id, input.password, user.passwordHash);
    values.passwordHash = await hashPassword(input.password);
  }
  await user.update(values);
  if (input.password && values.passwordHash)
    await savePasswordHistory(id, values.passwordHash);
  if (input.password || input.isActive === false)
    await Session.update(
      { revokedAt: new Date() },
      { where: { userId: id, revokedAt: null } },
    );
  await recordAudit("user_updated", {
    userId: actorId,
    ...metadata(audit.ipAddress, audit.userAgent),
    metadata: { targetUserId: id },
  });
  return getById(id);
};

export const remove = async (
  id: string,
  actorId: string,
  audit: { ipAddress: string | null; userAgent: string | null },
) => {
  if (id === actorId)
    throw new AppError(
      400,
      "No puedes eliminar tu propio usuario",
      "SELF_DELETE_NOT_ALLOWED",
    );
  const user = await User.findByPk(id);
  if (!user) throw new AppError(404, "Usuario no encontrado", "USER_NOT_FOUND");
  await Session.update(
    { revokedAt: new Date() },
    { where: { userId: id, revokedAt: null } },
  );
  await user.destroy();
  await recordAudit("user_deleted", {
    userId: actorId,
    ...metadata(audit.ipAddress, audit.userAgent),
    metadata: { targetUserId: id },
  });
};
