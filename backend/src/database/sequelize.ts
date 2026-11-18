import { Sequelize } from "sequelize";
import { env } from "../config/env.js";

const productionDatabaseOptions = env.NODE_ENV === "production"
  ? { dialectOptions: { ssl: { require: true, rejectUnauthorized: false } } }
  : {};

export const sequelize = new Sequelize(env.DATABASE_URL, {
  dialect: "postgres",
  logging: false,
  ...productionDatabaseOptions,
});
