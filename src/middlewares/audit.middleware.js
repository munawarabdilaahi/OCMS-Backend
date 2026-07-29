import prisma from '../config/db.js';

export function auditLog(action) {
    return async (req, res, next) => {
        const originalJson = res.json.bind(res);
        res.json = function (body) {
            if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
                prisma.auditLog.create({
                    data: {
                        user_id: req.user.id,
                        action,
                        resource: req.originalUrl,
                        method: req.method,
                        status_code: res.statusCode,
                        ip_address: req.ip,
                        user_agent: req.headers['user-agent'] || null,
                        metadata: {
                            body: sanitizeForLog(req.body),
                            params: req.params,
                            query: req.query,
                        },
                    },
                }).catch(() => {});
            }
            return originalJson(body);
        };
        next();
    };
}

function sanitizeForLog(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    const sensitive = ['password', 'token', 'secret', 'authorization'];
    const result = { ...obj };
    for (const key of Object.keys(result)) {
        if (sensitive.some((s) => key.toLowerCase().includes(s))) {
            result[key] = '[REDACTED]';
        }
    }
    return result;
}
