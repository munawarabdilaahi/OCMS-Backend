import { describe, it, expect } from '@jest/globals';
import { hashToken } from '../src/utils/hash.js';
import { generateToken, generateInvoiceNumber } from '../src/utils/crypto.js';
import { isInactive, isAllowedStatus } from '../src/utils/validation.js';

describe('hashToken', () => {
    it('returns a SHA-256 hex digest', () => {
        const hash = hashToken('test-token');
        expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('is deterministic', () => {
        expect(hashToken('hello')).toBe(hashToken('hello'));
    });

    it('produces different hashes for different inputs', () => {
        expect(hashToken('token-a')).not.toBe(hashToken('token-b'));
    });
});

describe('generateToken', () => {
    it('returns a hex string of the requested byte length', () => {
        const token = generateToken(16);
        expect(token).toMatch(/^[a-f0-9]{32}$/);
    });

    it('defaults to 32 bytes (64 hex chars)', () => {
        const token = generateToken();
        expect(token).toMatch(/^[a-f0-9]{64}$/);
    });
});

describe('generateInvoiceNumber', () => {
    it('matches the INV-{base36timestamp}-{base36random} format', () => {
        const inv = generateInvoiceNumber();
        expect(inv).toMatch(/^INV-[A-Z0-9]+-[A-Z0-9]+$/);
        expect(inv.length).toBeGreaterThan(8);
    });
});

describe('isInactive', () => {
    it('returns true for inactive statuses', () => {
        expect(isInactive('INACTIVE')).toBe(true);
        expect(isInactive('SUSPENDED')).toBe(true);
        expect(isInactive('DELETED')).toBe(true);
        expect(isInactive('DISABLED')).toBe(true);
    });

    it('returns false for ACTIVE', () => {
        expect(isInactive('ACTIVE')).toBe(false);
    });
});

describe('isAllowedStatus', () => {
    it('returns true if status is in allowed list', () => {
        expect(isAllowedStatus('ACTIVE', ['ACTIVE', 'INACTIVE'])).toBe(true);
    });

    it('returns false if status is not in allowed list', () => {
        expect(isAllowedStatus('DELETED', ['ACTIVE', 'INACTIVE'])).toBe(false);
    });
});
