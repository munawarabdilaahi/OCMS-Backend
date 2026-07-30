import { z } from 'zod';

export const createProgramSchema = z.object({
    name: z.string().min(1, 'Program name is required.'),
    code: z.string().optional(),
    department_id: z.number().int().positive('Department is required.'),
    duration_years: z.number().int().positive().optional(),
    type: z.string().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

export const updateProgramSchema = z.object({
    name: z.string().min(1, 'Program name is required.').optional(),
    code: z.string().optional(),
    department_id: z.number().int().positive().optional(),
    duration_years: z.number().int().positive().optional(),
    type: z.string().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});
