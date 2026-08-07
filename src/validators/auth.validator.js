import { z } from 'zod';
import { emailSchema, passwordSchema } from '../middlewares/validate.middleware.js';

export const registerSchema = z.object({
    name: z.string().min(1, 'Name, email, and password are required.'),
    email: emailSchema('Invalid email format.'),
    password: passwordSchema(),
    phone: z.string().optional(),
    role: z.enum(['Student']).optional(),
    roleName: z.enum(['Student']).optional(),
});

export const loginSchema = z.object({
    email: z.string().min(1, 'Email and password are required.').regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email format.'),
    password: z.string().min(1, 'Email and password are required.'),
});

export const forgotPasswordSchema = z.object({
    email: z.string().min(1, 'Email is required.').regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email format.'),
});

export const resetPasswordSchema = z.object({
    token: z.string().min(1, 'Reset token is required.'),
    password: passwordSchema(),
    confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
    message: 'Passwords must match.',
    path: ['confirmPassword'],
});

export const verifyEmailSchema = z.object({
    token: z.string().min(1, 'Verification token is required.'),
});

export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required.'),
    newPassword: passwordSchema(),
    confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
    message: 'Passwords must match.',
    path: ['confirmPassword'],
});

export const refreshTokenSchema = z.object({
    refreshToken: z.string().min(1, 'Refresh token is required.').optional(),
});
