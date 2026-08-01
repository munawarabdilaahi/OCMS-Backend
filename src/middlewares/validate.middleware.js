import { z } from 'zod';

export function validate(schema) {
    return (req, res, next) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            const firstError = result.error.issues?.[0] ?? result.error.errors?.[0];
            const message = firstError?.message || 'Invalid request data.';
            return res.status(400).json({
                success: false,
                message,
            });
        }
        req.body = result.data;
        next();
    };
}

export function emailSchema(msg) {
    return z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, msg);
}

export function passwordSchema() {
    return z.string()
        .min(8, 'Password must be at least 8 characters long.')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter.')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter.')
        .regex(/\d/, 'Password must contain at least one digit.');
}
