function stripHtml(value) {
    if (typeof value !== 'string') return value;
    return value
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<[^>]*>/g, '')
        .replace(/[<>]/g, '')
        .trim();
}

function sanitizeValue(value) {
    if (typeof value === 'string') return stripHtml(value);
    if (Array.isArray(value)) return value.map(sanitizeValue);
    if (value && typeof value === 'object') return sanitizeObject(value);
    return value;
}

function sanitizeObject(obj) {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
        result[key] = sanitizeValue(value);
    }
    return result;
}

export function sanitize(req, res, next) {
    if (req.body) req.body = sanitizeObject(req.body);
    if (req.query) {
        for (const key of Object.keys(req.query)) {
            if (typeof req.query[key] === 'string') {
                req.query[key] = req.query[key].replace(/[<>"']/g, '');
            }
        }
    }
    next();
}
