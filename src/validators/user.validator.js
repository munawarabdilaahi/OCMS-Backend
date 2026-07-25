import { z } from 'zod';
import { emailSchema } from '../middlewares/validate.middleware.js';

export const createUserSchema = z.object({
    name: z.string().min(1, 'Name, email, and password are required.'),
    email: emailSchema('Invalid email format.'),
    password: z.string().min(1, 'Name, email, and password are required.'),
    role_id: z.union([z.string(), z.number()]).optional(),
    roleId: z.union([z.string(), z.number()]).optional(),
    phone: z.string().optional(),
    status: z.string().optional(),
}).refine(data => data.role_id || data.roleId, {
    message: 'role_id is required.',
    path: ['role_id'],
});
