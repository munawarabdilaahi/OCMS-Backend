import { Router } from 'express';
import {
    forgotPassword,
    login,
    register,
    resetPassword,
    getMe,
    refreshToken,
    logout,
    generateEmailVerification,
    verifyEmail,
    getSessions,
    revokeSession,
    revokeAllSessions,
} from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authLimiter } from '../middlewares/rateLimit.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, verifyEmailSchema, refreshTokenSchema } from '../validators/auth.validator.js';

const router = Router();

router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), resetPassword);
router.post('/refresh-token', authLimiter, validate(refreshTokenSchema), refreshToken);

router.get('/me', authenticate, getMe);
router.post('/logout', authenticate, logout);

router.post('/verify-email/generate', authenticate, generateEmailVerification);
router.post('/verify-email', validate(verifyEmailSchema), verifyEmail);

router.get('/sessions', authenticate, getSessions);
router.delete('/sessions/:sessionId', authenticate, revokeSession);
router.delete('/sessions', authenticate, revokeAllSessions);

export default router;
