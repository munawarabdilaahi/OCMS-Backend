import { z } from 'zod';

export const createLevelSchema = z.object({
    name: z.string().min(1, 'Level name is required.'),
    code: z.string().optional(),
    program_id: z.number().int().positive('Program is required.'),
    sort_order: z.number().int().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

export const updateLevelSchema = z.object({
    name: z.string().min(1, 'Level name is required.').optional(),
    code: z.string().optional(),
    program_id: z.number().int().positive().optional(),
    sort_order: z.number().int().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});
