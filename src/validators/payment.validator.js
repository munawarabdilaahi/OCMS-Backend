import { z } from 'zod';

export const ALLOWED_PAYMENT_METHODS = ['CASH', 'CARD', 'BANK_TRANSFER', 'CHEQUE', 'ONLINE'];

export const createPaymentSchema = z.object({
    invoice_id: z.union([z.string().min(1, 'invoice_id, amount, and payment_method are required.'), z.number()]),
    invoiceId: z.union([z.string(), z.number()]).optional(),
    amount: z.union([z.string(), z.number()]).refine(val => {
        const num = Number(val);
        return !isNaN(num) && num > 0;
    }, 'Amount must be a positive number.'),
    payment_method: z.string().min(1, 'invoice_id, amount, and payment_method are required.').transform(val => val.toUpperCase()).refine(
        val => ALLOWED_PAYMENT_METHODS.includes(val),
        `Invalid payment_method. Allowed values: ${ALLOWED_PAYMENT_METHODS.join(', ')}`
    ),
    paymentMethod: z.string().optional(),
    reference_number: z.string().optional(),
    referenceNumber: z.string().optional(),
    notes: z.string().optional(),
    status: z.enum(['COMPLETED', 'PENDING', 'FAILED', 'REFUNDED']).optional(),
});
