import prisma from '../config/db.js';

export function auditLog(action) {
    return async (req, res, next) => {
        const start = Date.now();
        const originalJson = res.json.bind(res);
        res.json = function (body) {
            const statusCode = res.statusCode;
            if (req.user) {
                const metadata = {
                    body: sanitizeForLog(req.body),
                    params: req.params,
                    query: req.query,
                    duration_ms: Date.now() - start,
                };
                if (statusCode >= 400) {
                    metadata.error = typeof body === 'object' && body !== null ? body.message || body.error || body : body;
                }
                prisma.auditLog.create({
                    data: {
                        user_id: req.user.id,
                        action,
                        resource: req.originalUrl,
                        method: req.method,
                        status_code: statusCode,
                        ip_address: req.ip,
                        user_agent: req.headers['user-agent'] || null,
                        metadata,
                    },
                }).catch((err) => {
                    console.error(`Audit log failed [${action}]:`, err.message);
                });
            }
            return originalJson(body);
        };
        next();
    };
}

function sanitizeForLog(obj, depth = 0) {
    if (depth > 5 || !obj || typeof obj !== 'object') return obj;
    const sensitive = ['password', 'token', 'secret', 'authorization', 'credit_card', 'ssn', 'pin'];
    if (Array.isArray(obj)) {
        return obj.map((item) => sanitizeForLog(item, depth + 1));
    }
    const result = {};
    for (const key of Object.keys(obj)) {
        if (sensitive.some((s) => key.toLowerCase().includes(s))) {
            result[key] = '[REDACTED]';
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            result[key] = sanitizeForLog(obj[key], depth + 1);
        } else {
            result[key] = obj[key];
        }
    }
    return result;
}
