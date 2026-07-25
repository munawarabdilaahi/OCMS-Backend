import { z } from 'zod';

export const createInvoiceSchema = z.object({
    student_id: z.union([z.string().min(1, 'student_id, amount, and due_date are required.'), z.number()]),
    amount: z.union([z.string(), z.number()]).refine(val => {
        const num = Number(val);
        return !isNaN(num) && num > 0;
    }, 'Amount must be a positive number.'),
    due_date: z.string().min(1, 'student_id, amount, and due_date are required.'),
    dueDate: z.string().optional(),
    fee_structure_id: z.union([z.string(), z.number()]).optional(),
    feeStructureId: z.union([z.string(), z.number()]).optional(),
    academic_year: z.string().optional(),
    academicYear: z.string().optional(),
    semester: z.string().optional(),
    notes: z.string().optional(),
    status: z.string().optional(),
});
