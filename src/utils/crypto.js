import crypto from 'crypto';

export function generateToken(bytes = 32) {
    return crypto.randomBytes(bytes).toString('hex');
}

export function generateInvoiceNumber() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `INV-${timestamp}-${random}`;
}
