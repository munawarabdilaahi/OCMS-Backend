import { z } from 'zod';
import { emailSchema } from '../middlewares/validate.middleware.js';

const baseUserSchema = z.object({
    name: z.string().min(1, 'Name, email, and password are required.'),
    email: emailSchema('Invalid email format.'),
    password: z.string().min(1, 'Name, email, and password are required.'),
    role_id: z.union([z.string(), z.number()]).optional(),
    roleId: z.union([z.string(), z.number()]).optional(),
    phone: z.string().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'DELETED']).optional(),
});

export const createUserSchema = baseUserSchema.refine(data => data.role_id || data.roleId, {
    message: 'role_id is required.',
    path: ['role_id'],
});

export const updateUserSchema = z.object({
    name: z.string().min(1, 'Name, email, and password are required.').optional(),
    email: emailSchema('Invalid email format.').optional(),
    password: z.string().min(1, 'Name, email, and password are required.').optional(),
    role_id: z.union([z.string(), z.number()]).optional(),
    roleId: z.union([z.string(), z.number()]).optional(),
    phone: z.string().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'DELETED']).optional(),
});
