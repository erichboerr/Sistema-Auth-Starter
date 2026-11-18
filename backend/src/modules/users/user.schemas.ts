import Joi from "joi";

export const createUserSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(12).max(128).required(),
  roleId: Joi.string().uuid().required(),
}).unknown(false);
export const updateUserSchema = Joi.object({
  email: Joi.string().email(),
  roleId: Joi.string().uuid(),
  isActive: Joi.boolean(),
  password: Joi.string().min(12).max(128),
})
  .min(1)
  .unknown(false);
export const statusSchema = Joi.object({
  isActive: Joi.boolean().required(),
}).unknown(false);
