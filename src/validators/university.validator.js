import { z } from 'zod';

const universityTypes = ['PUBLIC', 'PRIVATE', 'CHARTERED', 'FAITH_BASED', 'OTHER'];
const universityStatuses = ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'CLOSED'];
const MAX_INT = 2147483647;

function positiveInt(label) {
    return z
        .union([z.string(), z.number()])
        .optional()
        .refine(
            (value) => {
                if (value === undefined || value === '') return true;
                const n = Number(value);
                return Number.isInteger(n) && n > 0 && n <= MAX_INT;
            },
            { message: `${label} must be a positive whole number up to ${MAX_INT}.` }
        );
}

export const createUniversitySchema = z.object({
    name: z.string().min(1, 'University name is required.').max(191, 'University name must be at most 191 characters.'),
    code: z.string().max(191).optional(),
    type: z.enum(universityTypes).optional(),
    established_date: z.string().optional(),
    accreditation_body: z.string().max(191).optional(),
    accreditation_status: z.string().max(191).optional(),
    accreditation_expiry: z.string().optional(),
    address: z.string().max(191).optional(),
    phone: z.string().max(191).optional(),
    email: z.string().email().max(191).optional().or(z.literal('')),
    website: z.string().url().max(191).optional().or(z.literal('')),
    timezone: z.string().max(191).optional(),
    locale: z.string().max(191).optional(),
    currency: z.string().max(191).optional(),
    logo_url: z.string().url().max(191).optional().or(z.literal('')),
    favicon_url: z.string().url().max(191).optional().or(z.literal('')),
    primary_color: z.string().max(191).optional(),
    secondary_color: z.string().max(191).optional(),
    contact_person_name: z.string().max(191).optional(),
    contact_person_email: z.string().email().max(191).optional().or(z.literal('')),
    contact_person_phone: z.string().max(191).optional(),
    mission_statement: z.string().max(191).optional(),
    vision_statement: z.string().max(191).optional(),
    motto: z.string().max(191).optional(),
    max_campuses: positiveInt('Max campuses'),
    max_students: positiveInt('Max students'),
    status: z.enum(universityStatuses).optional(),
});

export const updateUniversitySchema = z.object({
    name: z.string().min(1).max(191).optional(),
    code: z.string().max(191).optional(),
    type: z.enum(universityTypes).optional(),
    established_date: z.string().optional(),
    accreditation_body: z.string().max(191).optional(),
    accreditation_status: z.string().max(191).optional(),
    accreditation_expiry: z.string().optional(),
    address: z.string().max(191).optional(),
    phone: z.string().max(191).optional(),
    email: z.string().email().max(191).optional().or(z.literal('')),
    website: z.string().url().max(191).optional().or(z.literal('')),
    timezone: z.string().max(191).optional(),
    locale: z.string().max(191).optional(),
    currency: z.string().max(191).optional(),
    logo_url: z.string().url().max(191).optional().or(z.literal('')),
    favicon_url: z.string().url().max(191).optional().or(z.literal('')),
    primary_color: z.string().max(191).optional(),
    secondary_color: z.string().max(191).optional(),
    contact_person_name: z.string().max(191).optional(),
    contact_person_email: z.string().email().max(191).optional().or(z.literal('')),
    contact_person_phone: z.string().max(191).optional(),
    mission_statement: z.string().max(191).optional(),
    vision_statement: z.string().max(191).optional(),
    motto: z.string().max(191).optional(),
    max_campuses: positiveInt('Max campuses'),
    max_students: positiveInt('Max students'),
    status: z.enum(universityStatuses).optional(),
});
