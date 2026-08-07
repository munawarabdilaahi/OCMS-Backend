import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { sendMail, buildAuthLink } from '../src/utils/mailer.js';

describe('buildAuthLink', () => {
    it('uses the configured FRONTEND_URL', () => {
        process.env.FRONTEND_URL = 'https://app.example.com';
        expect(buildAuthLink('reset-password', 'tok123')).toBe('https://app.example.com/reset-password?token=tok123');
    });

    it('falls back to localhost', () => {
        delete process.env.FRONTEND_URL;
        expect(buildAuthLink('verify-email', 'abc')).toBe('http://localhost:3000/verify-email?token=abc');
    });

    it('encodes the token in the query string', () => {
        process.env.FRONTEND_URL = 'http://localhost:3000';
        expect(buildAuthLink('reset-password', 'a b&c=d')).toContain('token=a%20b%26c%3Dd');
    });
});

describe('sendMail', () => {
    beforeEach(() => {
        delete process.env.MAILER_HTTP_URL;
        delete process.env.MAILER_FROM;
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('returns not_configured when no mailer is configured', async () => {
        const result = await sendMail({ to: 'student@test.edu', subject: 'Hi', text: 'Body' });
        expect(result).toEqual({ delivered: false, reason: 'not_configured' });
    });

    it('returns missing_recipient when no recipient is given', async () => {
        process.env.MAILER_HTTP_URL = 'http://mailer:8080/send';
        const result = await sendMail({ subject: 'Hi', text: 'Body' });
        expect(result).toEqual({ delivered: false, reason: 'missing_recipient' });
    });

    it('returns delivered true on a 2xx response', async () => {
        process.env.MAILER_HTTP_URL = 'http://mailer:8080/send';
        jest.spyOn(global, 'fetch').mockResolvedValue({ ok: true, status: 200 });

        const result = await sendMail({ to: 'a@b.c', subject: 'S', text: 'T' });
        expect(result).toEqual({ delivered: true });
        expect(global.fetch).toHaveBeenCalledWith(
            'http://mailer:8080/send',
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({ from: 'no-reply@ocms.local', to: 'a@b.c', subject: 'S', text: 'T', html: null }),
            }),
        );
    });

    it('returns http_error and does not throw on a non-2xx response', async () => {
        process.env.MAILER_HTTP_URL = 'http://mailer:8080/send';
        jest.spyOn(global, 'fetch').mockResolvedValue({ ok: false, status: 500 });

        await expect(sendMail({ to: 'a@b.c', subject: 'S', text: 'T' })).resolves.toEqual({
            delivered: false,
            reason: 'http_error',
        });
    });

    it('returns error and does not throw on a network failure', async () => {
        process.env.MAILER_HTTP_URL = 'http://mailer:8080/send';
        jest.spyOn(global, 'fetch').mockRejectedValue(new Error('ECONNREFUSED'));

        await expect(sendMail({ to: 'a@b.c', subject: 'S', text: 'T' })).resolves.toEqual({
            delivered: false,
            reason: 'error',
        });
    });
});
