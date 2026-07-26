import { z } from 'zod';

export const createDepartmentSchema = z.object({
    name: z.string().min(1, 'Department name is required.'),
    code: z.string().optional(),
    description: z.string().optional(),
});

export const updateDepartmentSchema = z.object({
    name: z.string().min(1, 'Department name is required.').optional(),
    code: z.string().optional(),
    description: z.string().optional(),
});
