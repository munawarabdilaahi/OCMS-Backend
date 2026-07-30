import { z } from 'zod';

export const createSemesterSchema = z.object({
    name: z.string().min(1, 'Semester name is required.'),
    academic_year_id: z.number().int().positive('Academic year is required.'),
    start_date: z.string().min(1, 'Start date is required.'),
    end_date: z.string().min(1, 'End date is required.'),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

export const updateSemesterSchema = z.object({
    name: z.string().min(1, 'Semester name is required.').optional(),
    academic_year_id: z.number().int().positive().optional(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});
