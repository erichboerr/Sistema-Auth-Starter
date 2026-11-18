import bcrypt from "bcrypt";
import { PasswordHistory } from "./password-history.model.js";
import { AppError } from "../errors/app-error.js";
export const hashPassword = (password: string): Promise<string> => bcrypt.hash(password, 12);
// Política: no se puede reutilizar la contraseña actual ni ninguna de las
// tres anteriores. El límite se aplica por usuario y no guarda contraseñas
// en texto plano, solo hashes bcrypt.
export const assertPasswordNotReused = async (userId: string, password: string, currentHash: string): Promise<void> => { const history = await PasswordHistory.findAll({ where: { userId }, order: [["createdAt", "DESC"]], limit: 3 }); const matches = await Promise.all([currentHash, ...history.map((item) => item.passwordHash)].map((hash) => bcrypt.compare(password, hash))); if (matches.some(Boolean)) throw new AppError(409, "No puedes reutilizar una contraseña reciente", "PASSWORD_REUSED"); };
export const savePasswordHistory = (userId: string, passwordHash: string): Promise<PasswordHistory> => PasswordHistory.create({ userId, passwordHash });
