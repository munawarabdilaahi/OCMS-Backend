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

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               password: { type: string }
 *               phone: { type: string }
 *     responses:
 *       201:
 *         description: User registered successfully
 */
router.post('/register', authLimiter, validate(registerSchema), register);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Authenticate user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Login successful
 */
router.post('/login', authLimiter, validate(loginSchema), login);

/**
 * @openapi
 * /auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Request password reset email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string }
 *     responses:
 *       200:
 *         description: Password reset email sent
 */
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), forgotPassword);

/**
 * @openapi
 * /auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Reset password with token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Password reset successful
 */
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), resetPassword);

/**
 * @openapi
 * /auth/refresh-token:
 *   post:
 *     tags: [Auth]
 *     summary: Refresh access token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200:
 *         description: Token refreshed
 */
router.post('/refresh-token', authLimiter, validate(refreshTokenSchema), refreshToken);

/**
 * @openapi
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get current authenticated user
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Current user data
 */
router.get('/me', authenticate, getMe);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout and invalidate session
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Logged out
 */
router.post('/logout', authenticate, logout);

/**
 * @openapi
 * /auth/verify-email/generate:
 *   post:
 *     tags: [Auth]
 *     summary: Generate email verification token
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Verification email sent
 */
router.post('/verify-email/generate', authenticate, generateEmailVerification);

/**
 * @openapi
 * /auth/verify-email:
 *   post:
 *     tags: [Auth]
 *     summary: Verify email with token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token: { type: string }
 *     responses:
 *       200:
 *         description: Email verified
 */
router.post('/verify-email', authLimiter, validate(verifyEmailSchema), verifyEmail);

/**
 * @openapi
 * /auth/sessions:
 *   get:
 *     tags: [Auth]
 *     summary: List active sessions
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Active sessions list
 */
router.get('/sessions', authenticate, getSessions);

/**
 * @openapi
 * /auth/sessions/{sessionId}:
 *   delete:
 *     tags: [Auth]
 *     summary: Revoke a specific session
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema: { type: number }
 *     responses:
 *       200:
 *         description: Session revoked
 */
router.delete('/sessions/:sessionId', authenticate, revokeSession);

/**
 * @openapi
 * /auth/sessions:
 *   delete:
 *     tags: [Auth]
 *     summary: Revoke all sessions
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: All sessions revoked
 */
router.delete('/sessions', authenticate, revokeAllSessions);

export default router;
