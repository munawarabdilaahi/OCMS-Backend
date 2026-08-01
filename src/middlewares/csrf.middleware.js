const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

const ALLOWED_ORIGINS = (process.env.CORS_ORIGIN || 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean)
    .map((origin) => {
        try {
            return new URL(origin).origin;
        } catch {
            return null;
        }
    })
    .filter(Boolean);

function normalizeSource(value) {
    if (!value) return null;
    try {
        return new URL(value).origin;
    } catch {
        return null;
    }
}

export function csrfProtection(req, res, next) {
    if (SAFE_METHODS.has(req.method)) return next();

    const source = normalizeSource(req.headers.origin || req.headers.referer);

    if (!source) {
        return res.status(403).json({
            success: false,
            message: 'Request origin validation failed.',
        });
    }

    if (!ALLOWED_ORIGINS.includes(source)) {
        return res.status(403).json({
            success: false,
            message: 'Cross-site request forbidden.',
        });
    }

    next();
}
