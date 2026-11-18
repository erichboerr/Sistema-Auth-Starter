import { Router } from 'express';
import { csrf, login, logout, refresh, mfaSetup, mfaEnable, mfaDisable } from './auth.controller.js';
import { changePasswordSchema, loginSchema, refreshSchema } from './auth.schemas.js';
import { validateBody } from '../../shared/middleware/validate.js';
import { requireAccessToken } from './auth.middleware.js';
import { changePassword } from './auth.controller.js';
import { requireCsrfHeader } from '../../shared/middleware/csrf.js';
import { loginLimiter, passwordLimiter, refreshLimiter } from '../../shared/middleware/rate-limiters.js';

export const authRouter = Router();
authRouter.get('/csrf', csrf);
authRouter.post('/login', loginLimiter, validateBody(loginSchema), login);
authRouter.post('/refresh', refreshLimiter, requireCsrfHeader, validateBody(refreshSchema), refresh);
authRouter.post('/logout', requireCsrfHeader, logout);
authRouter.post('/change-password', passwordLimiter, requireAccessToken, validateBody(changePasswordSchema), changePassword);
authRouter.post('/mfa/setup', requireAccessToken, mfaSetup);
authRouter.post('/mfa/enable', requireAccessToken, mfaEnable);
authRouter.post('/mfa/disable', requireAccessToken, mfaDisable);
