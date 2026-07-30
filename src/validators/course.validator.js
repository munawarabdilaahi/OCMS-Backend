import { z } from 'zod';

export const createCourseSchema = z.object({
    title: z.string().min(1, 'Course title is required.'),
    code: z.string().optional(),
    credit_hours: z.union([z.string(), z.number()]).optional(),
    creditHours: z.union([z.string(), z.number()]).optional(),
    semester: z.string().optional(),
    department_id: z.union([z.string(), z.number()]).optional(),
    departmentId: z.union([z.string(), z.number()]).optional(),
    teacher_id: z.union([z.string(), z.number()]).optional(),
    teacherId: z.union([z.string(), z.number()]).optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

export const updateCourseSchema = z.object({
    title: z.string().min(1, 'Course title is required.').optional(),
    code: z.string().optional(),
    credit_hours: z.union([z.string(), z.number()]).optional(),
    creditHours: z.union([z.string(), z.number()]).optional(),
    semester: z.string().optional(),
    department_id: z.union([z.string(), z.number()]).optional(),
    departmentId: z.union([z.string(), z.number()]).optional(),
    teacher_id: z.union([z.string(), z.number()]).optional(),
    teacherId: z.union([z.string(), z.number()]).optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});
