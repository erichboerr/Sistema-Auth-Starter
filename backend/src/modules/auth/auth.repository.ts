import { Op } from "sequelize";
import { Role, Session, User } from "../../database/models.js";

export const findUserByEmail = (email: string) => User.findOne({ where: { email }, include: [{ model: Role, as: "role" }] });
export const createSession = (values: { userId: string; refreshTokenHash: string; expiresAt: Date; userAgent: string | null; ipAddress: string | null }) => Session.create(values);
export const findSessionByTokenHash = (hash: string) => Session.findOne({
  where: { [Op.or]: [{ refreshTokenHash: hash }, { previousTokenHash: hash }] },
  include: [{ model: User, as: "user", include: [{ model: Role, as: "role" }] }],
});
