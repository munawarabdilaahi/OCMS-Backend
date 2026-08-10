import { z } from 'zod';
import { emailSchema, passwordSchema } from '../middlewares/validate.middleware.js';

export const ALLOWED_GENDERS = ['MALE', 'FEMALE', 'OTHER'];

const baseTeacherSchema = z.object({
    name: z.string().min(1, 'Name, email, and password are required.'),
    email: emailSchema('Invalid email format.'),
    password: passwordSchema().optional(),
    department_id: z.union([z.string(), z.number()]).optional(),
    departmentId: z.union([z.string(), z.number()]).optional(),
    gender: z.string().optional().transform(val => val ? val.toUpperCase() : val),
    employee_no: z.string().optional(),
    employeeNo: z.string().optional(),
    position: z.string().optional(),
    qualification: z.string().optional(),
    address: z.string().optional(),
    phone: z.string().optional(),
});

export const createTeacherSchema = baseTeacherSchema.refine(data => {
    if (!data.gender) return true;
    return ALLOWED_GENDERS.includes(data.gender.toUpperCase());
}, { message: 'Invalid gender. Allowed values: MALE, FEMALE, OTHER', path: ['gender'] });

export const updateTeacherSchema = z.object({
    name: z.string().min(1, 'Name, email, and password are required.').optional(),
    email: emailSchema('Invalid email format.').optional(),
    password: passwordSchema().optional(),
    department_id: z.union([z.string(), z.number()]).optional(),
    departmentId: z.union([z.string(), z.number()]).optional(),
    gender: z.string().optional().transform(val => val ? val.toUpperCase() : val),
    employee_no: z.string().optional(),
    employeeNo: z.string().optional(),
    position: z.string().optional(),
    qualification: z.string().optional(),
    address: z.string().optional(),
    phone: z.string().optional(),
}).refine(data => {
    if (!data.gender) return true;
    return ALLOWED_GENDERS.includes(data.gender);
}, { message: 'Invalid gender. Allowed values: MALE, FEMALE, OTHER', path: ['gender'] });
