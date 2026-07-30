import { z } from 'zod';

export const createAcademicYearSchema = z.object({
    name: z.string().min(1, 'Academic year name is required.'),
    start_date: z.string().min(1, 'Start date is required.'),
    end_date: z.string().min(1, 'End date is required.'),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

export const updateAcademicYearSchema = z.object({
    name: z.string().min(1, 'Academic year name is required.').optional(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});
