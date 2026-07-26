import { z } from 'zod';
import { emailSchema } from '../middlewares/validate.middleware.js';

export const ALLOWED_GENDERS = ['MALE', 'FEMALE', 'OTHER'];

const baseStudentSchema = z.object({
    name: z.string().min(1, 'Name, email, password, and department_id are required.'),
    email: emailSchema('Invalid email format.'),
    password: z.string().min(1, 'Name, email, password, and department_id are required.'),
    department_id: z.union([z.string(), z.number()]).optional(),
    departmentId: z.union([z.string(), z.number()]).optional(),
    gender: z.string().optional().transform(val => val ? val.toUpperCase() : val),
    date_of_birth: z.string().optional(),
    dateOfBirth: z.string().optional(),
    address: z.string().optional(),
    phone: z.string().optional(),
});

export const createStudentSchema = baseStudentSchema.refine(data => {
    if (data.department_id || data.departmentId) return true;
    return false;
}, { message: 'Name, email, password, and department_id are required.', path: ['department_id'] }).refine(data => {
    if (!data.gender) return true;
    return ALLOWED_GENDERS.includes(data.gender.toUpperCase());
}, { message: 'Invalid gender. Allowed values: MALE, FEMALE, OTHER', path: ['gender'] });

export const updateStudentSchema = z.object({
    name: z.string().min(1, 'Name, email, password, and department_id are required.').optional(),
    email: emailSchema('Invalid email format.').optional(),
    password: z.string().min(1, 'Name, email, password, and department_id are required.').optional(),
    department_id: z.union([z.string(), z.number()]).optional(),
    departmentId: z.union([z.string(), z.number()]).optional(),
    gender: z.string().optional().transform(val => val ? val.toUpperCase() : val),
    date_of_birth: z.string().optional(),
    dateOfBirth: z.string().optional(),
    address: z.string().optional(),
    phone: z.string().optional(),
}).refine(data => {
    if (!data.gender) return true;
    return ALLOWED_GENDERS.includes(data.gender);
}, { message: 'Invalid gender. Allowed values: MALE, FEMALE, OTHER', path: ['gender'] });

export const updateStudentStatusSchema = z.object({
    status: z.string().optional(),
});
