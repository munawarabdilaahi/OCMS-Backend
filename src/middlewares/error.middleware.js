export function notFound(req, res, next) {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
}

export function errorHandler(error, req, res, next) {
  const statusCode = error.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: error.message || 'Internal server error',
    errors: error.errors || null,
    stack: process.env.NODE_ENV === 'production' ? undefined : error.stack,
  });
}