const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

const ALLOWED_ORIGINS = (process.env.CORS_ORIGIN || 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

export function csrfProtection(req, res, next) {
    if (SAFE_METHODS.has(req.method)) return next();

    const origin = req.headers.origin;
    const referer = req.headers.referer;

    if (!origin && !referer) {
        return res.status(403).json({
            success: false,
            message: 'Request origin validation failed.',
        });
    }

    const source = origin || referer;
    const isAllowed = ALLOWED_ORIGINS.some((allowed) => source.startsWith(allowed));

    if (!isAllowed) {
        return res.status(403).json({
            success: false,
            message: 'Cross-site request forbidden.',
        });
    }

    next();
}
