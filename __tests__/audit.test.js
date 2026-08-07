import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import prisma from '../src/config/db.js';
import { auditLog, sanitizeForLog, truncateString } from '../src/middlewares/audit.middleware.js';

function mockReq(overrides = {}) {
    return {
        method: 'POST',
        originalUrl: '/api/auth/login',
        ip: '127.0.0.1',
        headers: { 'user-agent': 'jest-agent' },
        body: { email: 'student@test.edu', password: 'super-secret' },
        ...overrides,
    };
}

function mockRes() {
    const res = {
        statusCode: 200,
        body: null,
        json(payload) {
            this.body = payload;
            return this;
        },
    };
    return res;
}

async function runMiddleware(action, req) {
    const res = mockRes();
    const next = jest.fn();
    await auditLog(action)(req, res, next);
    res.json({ success: true, message: 'done.' });
    return { res, next };
}

describe('auditLog middleware', () => {
    beforeEach(() => {
        jest.spyOn(prisma.auditLog, 'create').mockResolvedValue({});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('logs anonymous auth events (login without req.user)', async () => {
        await runMiddleware('LOGIN', mockReq());

        expect(prisma.auditLog.create).toHaveBeenCalledTimes(1);
        const callArgs = prisma.auditLog.create.mock.calls[0][0];
        expect(callArgs.data.action).toBe('LOGIN');
        expect(callArgs.data.user_id).toBeNull();
        expect(callArgs.data.resource).toBe('/api/auth/login');
        expect(callArgs.data.method).toBe('POST');
    });

    it('resolves actor from req.auditActor for anonymous routes', async () => {
        const req = mockReq({ auditActor: { id: 7, email: 'student@test.edu' } });
        await runMiddleware('LOGIN', req);

        const callArgs = prisma.auditLog.create.mock.calls[0][0];
        expect(callArgs.data.user_id).toBe(7);
        expect(callArgs.data.metadata.actor).toEqual({ email: 'student@test.edu' });
    });

    it('resolves actor from req.user for authenticated routes', async () => {
        const req = mockReq({ user: { id: 42, email: 'admin@test.edu' } });
        await runMiddleware('CHANGE_PASSWORD', req);

        const callArgs = prisma.auditLog.create.mock.calls[0][0];
        expect(callArgs.data.user_id).toBe(42);
    });

    it('prefers req.user over req.auditActor when both are present', async () => {
        const req = mockReq({ user: { id: 1 }, auditActor: { id: 2 } });
        await runMiddleware('LOGIN', req);

        const callArgs = prisma.auditLog.create.mock.calls[0][0];
        expect(callArgs.data.user_id).toBe(1);
    });

    it('records failure status codes and redacts secrets from metadata', async () => {
        const res = mockRes();
        const next = jest.fn();
        await auditLog('LOGIN')(mockReq(), res, next);
        res.statusCode = 401;
        res.json({ success: false, message: 'Invalid email or password.' });

        const callArgs = prisma.auditLog.create.mock.calls[0][0];
        expect(callArgs.data.status_code).toBe(401);
        expect(callArgs.data.metadata.body.password).toBe('[REDACTED]');
        expect(callArgs.data.metadata.error).toBe('Invalid email or password.');
    });

    it('always sends the original response even if the write rejects', async () => {
        prisma.auditLog.create.mockRejectedValueOnce(new Error('db down'));

        const { res } = await runMiddleware('LOGIN', mockReq());
        expect(res.body).toEqual({ success: true, message: 'done.' });
    });
});

describe('sanitizeForLog', () => {
    it('redacts password and token fields', () => {
        const cleaned = sanitizeForLog({
            email: 'a@b.c',
            password: 'x',
            refreshToken: 'y',
            token: 'z',
        });
        expect(cleaned).toEqual({
            email: 'a@b.c',
            password: '[REDACTED]',
            refreshToken: '[REDACTED]',
            token: '[REDACTED]',
        });
    });

    it('handles null and primitives', () => {
        expect(sanitizeForLog(null)).toEqual({});
        expect(sanitizeForLog('hi')).toEqual({ value: 'hi' });
    });
});

describe('truncateString', () => {
    it('truncates long strings and returns null for undefined', () => {
        expect(truncateString('a'.repeat(1000), 10)).toBe('a'.repeat(10));
        expect(truncateString(undefined, 10)).toBeNull();
        expect(truncateString('ok', 10)).toBe('ok');
    });
});
