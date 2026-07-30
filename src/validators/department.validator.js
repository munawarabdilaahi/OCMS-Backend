import { z } from 'zod';

const departmentStatuses = ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'CLOSED'];

export const createDepartmentSchema = z.object({
    name: z.string().min(1, 'Department name is required.').max(200),
    code: z.string().max(20).optional(),
    established_date: z.string().optional(),
    description: z.string().max(1000).optional(),
    phone: z.string().max(50).optional(),
    email: z.string().email().optional().or(z.literal('')),
    office_location: z.string().max(200).optional(),
    vision: z.string().max(2000).optional(),
    mission: z.string().max(2000).optional(),
    hod_name: z.string().max(200).optional(),
    hod_email: z.string().email().optional().or(z.literal('')),
    hod_phone: z.string().max(50).optional(),
    max_programs: z.union([z.string(), z.number()]).optional(),
    max_teachers: z.union([z.string(), z.number()]).optional(),
    student_capacity: z.union([z.string(), z.number()]).optional(),
    facilities: z.any().optional(),
    research_areas: z.any().optional(),
    faculty_id: z.number().int().positive('Faculty is required.'),
    status: z.enum(departmentStatuses).optional(),
});

export const updateDepartmentSchema = z.object({
    name: z.string().min(1, 'Department name is required.').max(200).optional(),
    code: z.string().max(20).optional(),
    established_date: z.string().optional(),
    description: z.string().max(1000).optional(),
    phone: z.string().max(50).optional(),
    email: z.string().email().optional().or(z.literal('')),
    office_location: z.string().max(200).optional(),
    vision: z.string().max(2000).optional(),
    mission: z.string().max(2000).optional(),
    hod_name: z.string().max(200).optional(),
    hod_email: z.string().email().optional().or(z.literal('')),
    hod_phone: z.string().max(50).optional(),
    max_programs: z.union([z.string(), z.number()]).optional(),
    max_teachers: z.union([z.string(), z.number()]).optional(),
    student_capacity: z.union([z.string(), z.number()]).optional(),
    facilities: z.any().optional(),
    research_areas: z.any().optional(),
    faculty_id: z.number().int().positive().optional(),
    status: z.enum(departmentStatuses).optional(),
});
