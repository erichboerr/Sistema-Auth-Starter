import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env.js";
import { logger } from "./shared/logger/logger.js";
import { errorHandler } from "./shared/middleware/error-handler.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { sessionRouter } from "./modules/sessions/session.routes.js";
import { userRouter } from "./modules/users/user.routes.js";
import { auditRouter } from "./modules/audit/audit.routes.js";
import { openapiSpec } from "./config/openapi.js";

// La instancia se exporta sin iniciar el puerto para que pueda probarse con
// facilidad y para que `server.ts` controle el ciclo de vida del proceso.
export const app = express();

// Evita revelar que el servidor utiliza Express.
app.disable("x-powered-by");

// Headers de seguridad como CSP, HSTS y X-Content-Type-Options.
app.use(helmet());

// Solo se aceptan los orígenes definidos explícitamente en APP_ORIGINS.
app.use(cors({ origin: env.APP_ORIGINS, credentials: true }));

// Límite defensivo contra bodies excesivamente grandes.
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));

// Necesario para leer y limpiar la cookie HttpOnly del refresh token.
app.use(cookieParser());

// Morgan registra metadatos HTTP; no debe registrar headers sensibles.
app.use(
  morgan("combined", {
    stream: { write: (message: string) => logger.http(message.trim()) },
  }),
);

// Límite global inicial. Auth tendrá límites más estrictos en su propio módulo.
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

// Endpoint sin autenticación para balanceadores, PM2 y monitoreo.
app.get("/health", (_req, res) =>
  res.json({ status: "ok", service: "sistema-auth-starter" }),
);
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openapiSpec));
app.use("/api/auth", authRouter);
app.use("/api/sessions", sessionRouter);
app.use("/api/users", userRouter);
app.use("/api/audit", auditRouter);

// Las rutas inexistentes tienen un contrato JSON consistente.
app.use((_req, res) =>
  res
    .status(404)
    .json({ error: { code: "NOT_FOUND", message: "Recurso no encontrado" } }),
);

// Debe permanecer después de todas las rutas.
app.use(errorHandler);
