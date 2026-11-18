import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { env } from "../../config/env.js";
const key = Buffer.from(env.MFA_ENCRYPTION_KEY, "hex");
export const encryptMfaSecret = (value: string): string => { const iv=randomBytes(12); const cipher=createCipheriv("aes-256-gcm",key,iv); const encrypted=Buffer.concat([cipher.update(value,"utf8"),cipher.final()]); return `${iv.toString("hex")}:${cipher.getAuthTag().toString("hex")}:${encrypted.toString("hex")}`; };
export const decryptMfaSecret = (value: string): string => { const [ivHex,tagHex,dataHex]=value.split(":"); const decipher=createDecipheriv("aes-256-gcm",key,Buffer.from(ivHex!,"hex")); decipher.setAuthTag(Buffer.from(tagHex!,"hex")); return Buffer.concat([decipher.update(Buffer.from(dataHex!,"hex")),decipher.final()]).toString("utf8"); };
