export function notFound(req, res, next) {
    const error = new Error(`Route not found: ${req.originalUrl}`);
    error.statusCode = 404;
    next(error);
}

export function errorHandler(error, req, res, _next) {
    let statusCode = error.statusCode || 500;
    let message = error.message || 'Internal server error';

    if (error.code === 'P2002') {
        statusCode = 409;
        const target = error.meta?.target;
        message = target
            ? `A record with this ${target.replace(' (map_name: User_email_key)', '')} already exists.`
            : 'A record with this value already exists.';
    } else if (error.code === 'P2025') {
        statusCode = 404;
        message = 'The requested record was not found.';
    } else if (error.code === 'P2003') {
        statusCode = 400;
        message = 'Related record not found. Check that referenced IDs are valid.';
    }

    if (error.name === 'SyntaxError' && error.status === 400 && 'body' in error) {
        statusCode = 400;
        message = 'Malformed JSON in request body.';
    }

    const isProduction = process.env.NODE_ENV === 'production';

    console.error(`[ERROR] ${statusCode} - ${message}`, isProduction ? '' : error.stack);

    res.status(statusCode).json({
        success: false,
        message,
        errors: error.errors || null,
        ...(isProduction ? {} : { stack: error.stack }),
    });
}
