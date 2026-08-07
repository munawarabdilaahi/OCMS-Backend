import prisma from '../config/db.js';

const MAX_USER_AGENT_LENGTH = 500;

function resolveActorId(req) {
    return req.user?.id || req.auditActor?.id || null;
}

function resolveActorEmail(req) {
    return req.auditActor?.email || req.user?.email || null;
}

export function auditLog(action) {
    return async (req, res, next) => {
        const start = Date.now();
        const originalJson = res.json.bind(res);

        res.json = function (body) {
            try {
                const statusCode = res.statusCode;
                const actorId = resolveActorId(req);
                const actorEmail = resolveActorEmail(req);

                const metadata = {
                    body: sanitizeForLog(req.body),
                    params: req.params,
                    query: req.query,
                    duration_ms: Date.now() - start,
                };
                if (actorEmail) {
                    metadata.actor = { email: actorEmail };
                }
                if (statusCode >= 400) {
                    metadata.error =
                        typeof body === 'object' && body !== null
                            ? body.message || body.error || body
                            : body;
                }

                prisma.auditLog.create({
                    data: {
                        user_id: actorId,
                        action,
                        resource: req.originalUrl,
                        method: req.method,
                        status_code: statusCode,
                        ip_address: req.ip,
                        user_agent: truncateString(req.headers['user-agent'], MAX_USER_AGENT_LENGTH),
                        metadata,
                    },
                }).catch((error) => {
                    console.error(`Audit log write failed [${action}]:`, error.message || error);
                });
            } catch (error) {
                console.error(`Audit log build failed [${action}]:`, error.message || error);
            }
            return originalJson(body);
        };

        next();
    };
}

export function sanitizeForLog(body) {
    if (body == null) return {};
    if (typeof body !== 'object') return { value: String(body) };
    if (Array.isArray(body)) return body.map((entry) => sanitizeForLog(entry));

    return Object.keys(body).reduce((acc, key) => {
        const value = body[key];
        if (['password', 'currentPassword', 'newPassword', 'refreshToken', 'accessToken', 'token'].includes(key)) {
            acc[key] = '[REDACTED]';
        } else {
            acc[key] = value;
        }
        return acc;
    }, {});
}

export function truncateString(value, maxLength) {
    if (value == null) return null;
    const str = String(value);
    return str.length > maxLength ? str.slice(0, maxLength) : str;
}
