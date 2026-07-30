import { z } from 'zod';

const baseFeeSchema = z.object({
    name: z.string().min(1, 'Name, amount, and academic_year are required.'),
    amount: z.union([z.string(), z.number()]).refine(val => {
        const num = Number(val);
        return !isNaN(num) && num > 0;
    }, 'Amount must be a positive number.'),
    academic_year: z.string().min(1, 'Name, amount, and academic_year are required.'),
    academicYear: z.string().optional(),
    description: z.string().optional(),
    department_id: z.union([z.string(), z.number()]).optional(),
    departmentId: z.union([z.string(), z.number()]).optional(),
    semester: z.string().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

export const createFeeSchema = baseFeeSchema;

export const updateFeeSchema = z.object({
    name: z.string().min(1, 'Name, amount, and academic_year are required.').optional(),
    amount: z.union([z.string(), z.number()]).refine(val => {
        const num = Number(val);
        return !isNaN(num) && num > 0;
    }, 'Amount must be a positive number.').optional(),
    academic_year: z.string().min(1, 'Name, amount, and academic_year are required.').optional(),
    academicYear: z.string().optional(),
    description: z.string().optional(),
    department_id: z.union([z.string(), z.number()]).optional(),
    departmentId: z.union([z.string(), z.number()]).optional(),
    semester: z.string().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});
