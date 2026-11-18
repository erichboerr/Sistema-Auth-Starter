import rateLimit from "express-rate-limit";
import Redis from "ioredis";
import { RedisStore } from "rate-limit-redis";
import { env } from "../../config/env.js";

// Límites diferenciados: autenticación recibe más protección que endpoints
// generales. El store predeterminado es local al proceso, suficiente para el
// template; en producción multi-instancia se reemplaza por Redis.
const redis = env.REDIS_URL ? new Redis(env.REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 1 }) : null;
const sharedStore = redis ? {
  store: new RedisStore({
    sendCommand: (...args: string[]) => {
      const [command, ...commandArgs] = args;
      return redis.call(command ?? "", ...commandArgs) as unknown as Promise<string>;
    },
  }),
} : {};
const createLimiter = (limit: number, code: string, message: string) => rateLimit({ windowMs: 15 * 60 * 1000, limit, standardHeaders: true, legacyHeaders: false, message: { error: { code, message } }, ...sharedStore });
export const loginLimiter = createLimiter(10, "LOGIN_RATE_LIMIT", "Demasiados intentos de inicio de sesión");
export const refreshLimiter = createLimiter(30, "REFRESH_RATE_LIMIT", "Demasiados intentos de renovación");
export const passwordLimiter = createLimiter(5, "PASSWORD_RATE_LIMIT", "Demasiados intentos de cambio de contraseña");
