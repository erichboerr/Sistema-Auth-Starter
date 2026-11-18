import type { ErrorRequestHandler } from "express";
import { AppError } from "../errors/app-error.js";
import { logger } from "../logger/logger.js";

// Último middleware de la cadena. Convierte errores internos en respuestas
// JSON consistentes sin filtrar stack traces ni detalles de PostgreSQL.
export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  const appError =
    error instanceof AppError
      ? error
      : new AppError(500, "Error interno del servidor", "INTERNAL_ERROR");
  if (appError.statusCode >= 500) {
    // El cliente recibe un mensaje genérico, pero el log conserva nombre y
    // stack para diagnosticar fallas posteriores al servicio (por ejemplo,
    // serialización o configuración de cookies).
    logger.error({
      error: error instanceof Error ? error.message : error,
      name: error instanceof Error ? error.name : "UnknownError",
      stack: error instanceof Error ? error.stack : undefined,
    });
  }
  res
    .status(appError.statusCode)
    .json({ error: { code: appError.code, message: appError.message } });
};
