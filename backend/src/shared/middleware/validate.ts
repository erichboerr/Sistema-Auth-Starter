import type { RequestHandler } from "express";
import type Joi from "joi";
import { AppError } from "../errors/app-error.js";

// Valida el body antes de que llegue al controller. La opción stripUnknown
// elimina campos no contemplados para reducir entradas inesperadas.
export const validateBody = (schema: Joi.ObjectSchema): RequestHandler => (req, _res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) return next(new AppError(400, "Datos de entrada inválidos", "VALIDATION_ERROR"));
  req.body = value;
  next();
};
