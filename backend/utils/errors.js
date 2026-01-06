// Custom error classes for consistent error handling

export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message, field = null) {
    super(message, 400);
    this.field = field;
  }
}

export class NotFoundError extends AppError {
  constructor(message) {
    super(message, 404);
  }
}

export class DatabaseError extends AppError {
  constructor(message, originalError = null) {
    super(message, 500);
    this.originalError = originalError;
  }
}

export class AuthenticationError extends AppError {
  constructor(message) {
    super(message, 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message, required = null) {
    super(message, 403);
    this.required = required;
  }
}

// Helper function to check if error is operational (expected)
export const isOperationalError = (error) => {
  return error instanceof AppError;
};