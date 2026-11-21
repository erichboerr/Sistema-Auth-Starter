// Carga .env, .env.development, .env.production, etc. según NODE_ENV.
import "dotenv-flow/config";
import Joi from "joi";

// Toda la aplicación importa `env` desde este archivo. Si una variable falta
// o tiene un formato incorrecto, el proceso termina antes de abrir el puerto.
const schema = Joi.object({
  NODE_ENV: Joi.string()
    .valid("development", "test", "production")
    .default("development"),
  PORT: Joi.number().port().default(3000),
  APP_ORIGINS: Joi.string().required(),
  DATABASE_URL: Joi.string()
    .uri({ scheme: ["postgres", "postgresql"] })
    .required(),
  JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_EXPIRES_IN: Joi.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default("7d"),
  COOKIE_SECURE: Joi.boolean().truthy("true").falsy("false").default(false),
  COOKIE_SAME_SITE: Joi.string().valid("lax", "strict", "none").default("lax"),
  LOG_LEVEL: Joi.string().default("info"),
  REDIS_URL: Joi.string()
    .uri({ scheme: ["redis", "rediss"] })
    .empty("")
    .optional(),
  MFA_ENCRYPTION_KEY: Joi.string().hex().length(64).required(),
}).unknown(false);

// process.env contiene cientos de variables del sistema operativo, VS Code y
// npm. Solo pasamos al esquema las claves que pertenecen a esta aplicación.
const applicationEnv = {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  APP_ORIGINS: process.env.APP_ORIGINS,
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN,
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN,
  COOKIE_SECURE: process.env.COOKIE_SECURE,
  COOKIE_SAME_SITE: process.env.COOKIE_SAME_SITE,
  LOG_LEVEL: process.env.LOG_LEVEL,
  REDIS_URL: process.env.REDIS_URL,
  MFA_ENCRYPTION_KEY: process.env.MFA_ENCRYPTION_KEY,
};

const { error, value } = schema.validate(applicationEnv, { abortEarly: false });
if (error) throw new Error(`Configuración inválida: ${error.message}`);

if (value.NODE_ENV === "production" && value.COOKIE_SECURE !== true) {
  throw new Error(
    "Configuración inválida: COOKIE_SECURE debe ser true en producción",
  );
}

export const env = {
  ...value,
  APP_ORIGINS: value.APP_ORIGINS.split(",").map((origin: string) =>
    origin.trim(),
  ),
} as {
  NODE_ENV: "development" | "test" | "production";
  PORT: number;
  APP_ORIGINS: string[];
  DATABASE_URL: string;
  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_ACCESS_EXPIRES_IN: string;
  JWT_REFRESH_EXPIRES_IN: string;
  COOKIE_SECURE: boolean;
  COOKIE_SAME_SITE: "lax" | "strict" | "none";
  LOG_LEVEL: string;
  REDIS_URL?: string;
  MFA_ENCRYPTION_KEY: string;
};
