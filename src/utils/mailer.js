const DEFAULT_FROM = 'no-reply@ocms.local';
const DEFAULT_FRONTEND_URL = 'http://localhost:3000';

export function buildAuthLink(path, token) {
    const frontendUrl = process.env.FRONTEND_URL || DEFAULT_FRONTEND_URL;
    return `${frontendUrl}/${path}?token=${encodeURIComponent(token)}`;
}

export async function sendMail({ to, subject, text, html = null }) {
    if (!to) {
        return { delivered: false, reason: 'missing_recipient' };
    }

    const mailerUrl = process.env.MAILER_HTTP_URL;
    if (!mailerUrl) {
        console.log(`[mailer] email not sent (MAILER_HTTP_URL not configured) -> to=${to} subject="${subject}"`);
        return { delivered: false, reason: 'not_configured' };
    }

    const from = process.env.MAILER_FROM || DEFAULT_FROM;

    try {
        const response = await fetch(mailerUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ from, to, subject, text, html }),
        });
        if (!response.ok) {
            console.error(`[mailer] delivery failed (HTTP ${response.status}) -> to=${to} subject="${subject}"`);
            return { delivered: false, reason: 'http_error' };
        }
        return { delivered: true };
    } catch (error) {
        console.error(`[mailer] delivery error -> to=${to} subject="${subject}":`, error.message || error);
        return { delivered: false, reason: 'error' };
    }
}
