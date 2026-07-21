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

const router = Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);
router.post('/refresh-token', authLimiter, refreshToken);

router.get('/me', authenticate, getMe);
router.post('/logout', authenticate, logout);

router.post('/verify-email/generate', authenticate, generateEmailVerification);
router.post('/verify-email', verifyEmail);

router.get('/sessions', authenticate, getSessions);
router.delete('/sessions/:sessionId', authenticate, revokeSession);
router.delete('/sessions', authenticate, revokeAllSessions);

export default router;
