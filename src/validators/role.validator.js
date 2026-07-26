import { z } from 'zod';

export const createRoleSchema = z.object({
    name: z.string().min(1, 'Role name is required.'),
    permissions: z.any().optional(),
});

export const updateRoleSchema = z.object({
    name: z.string().min(1, 'Role name is required.').optional(),
    permissions: z.any().optional(),
});
