import Joi from "joi";
export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(128).required(),
  mfaCode: Joi.string().length(6).pattern(/^\d+$/).optional(),
});

export const refreshSchema = Joi.object({}).unknown(false);
export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().min(8).max(128).required(),
  newPassword: Joi.string()
    .min(12)
    .max(128)
    .required()
    .invalid(Joi.ref("currentPassword")),
}).unknown(false);
