import { ValidationError, NotFoundError, DatabaseError, AuthenticationError, AuthorizationError } from '../utils/errors.js';

export const errorHandler = (error, req, res, next) => {
  // Log error for debugging
  console.error('API Error:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    user: req.user?.email || 'anonymous'
  });

  // Handle validation errors
  if (error instanceof ValidationError) {
    return res.status(error.statusCode).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: error.message,
        field: error.field
      }
    });
  }

  // Handle not found errors
  if (error instanceof NotFoundError) {
    return res.status(error.statusCode).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: error.message
      }
    });
  }

  // Handle authentication errors
  if (error instanceof AuthenticationError) {
    return res.status(error.statusCode).json({
      success: false,
      error: {
        code: 'AUTHENTICATION_REQUIRED',
        message: error.message
      }
    });
  }

  // Handle authorization errors
  if (error instanceof AuthorizationError) {
    return res.status(error.statusCode).json({
      success: false,
      error: {
        code: 'INSUFFICIENT_PERMISSIONS',
        message: error.message,
        required: error.required
      }
    });
  }

  // Handle database errors
  if (error instanceof DatabaseError) {
    return res.status(error.statusCode).json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'A database error occurred'
      }
    });
  }

  // Handle unknown errors
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred'
    }
  });
};

export default errorHandler;