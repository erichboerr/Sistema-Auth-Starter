import winston from "winston";
import { env } from "../../config/env.js";

// El logger central evita usar console.log disperso por la aplicación.
// Nunca se deben enviar contraseñas, tokens, cookies ni hashes a este logger.
export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  transports: [new winston.transports.Console()],
});
