/**
 * Standardized Error Handling Pattern
 * 
 * All API functions should throw typed errors for consistent error handling
 * across the application.
 */

export enum ErrorCode {
  // Authentication errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  
  // Authorization errors
  FORBIDDEN = 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  
  // Not found errors
  NOT_FOUND = 'NOT_FOUND',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  
  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  
  // Database errors
  DATABASE_ERROR = 'DATABASE_ERROR',
  CONSTRAINT_VIOLATION = 'CONSTRAINT_VIOLATION',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
  
  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  
  // Business logic errors
  BUSINESS_LOGIC_ERROR = 'BUSINESS_LOGIC_ERROR',
  INVALID_STATE = 'INVALID_STATE',
  
  // Unknown errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(
    message: string,
    code: ErrorCode = ErrorCode.UNKNOWN_ERROR,
    statusCode: number = 500,
    details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    
    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized access', details?: unknown) {
    super(message, ErrorCode.UNAUTHORIZED, 401, details);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access forbidden', details?: unknown) {
    super(message, ErrorCode.FORBIDDEN, 403, details);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', details?: unknown) {
    super(message, ErrorCode.NOT_FOUND, 404, details);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details?: unknown) {
    super(message, ErrorCode.VALIDATION_ERROR, 400, details);
    this.name = 'ValidationError';
  }
}

export class DatabaseError extends AppError {
  constructor(message = 'Database operation failed', details?: unknown) {
    super(message, ErrorCode.DATABASE_ERROR, 500, details);
    this.name = 'DatabaseError';
  }
}

export class BusinessLogicError extends AppError {
  constructor(message = 'Business logic error', details?: unknown) {
    super(message, ErrorCode.BUSINESS_LOGIC_ERROR, 400, details);
    this.name = 'BusinessLogicError';
  }
}

/**
 * Convert Supabase error to AppError
 */
export function handleSupabaseError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  const errorMessage =
    error instanceof Error
      ? error.message
      : typeof error === 'object' &&
          error !== null &&
          'message' in error &&
          typeof error.message === 'string'
        ? error.message
        : null;

  if (errorMessage) {
    const message = errorMessage.toLowerCase();
    
    // Authentication errors
    if (message.includes('jwt') || message.includes('auth')) {
      return new UnauthorizedError(errorMessage, error);
    }
    
    // Not found errors
    if (message.includes('not found') || message.includes('no rows')) {
      return new NotFoundError(errorMessage, error);
    }
    
    // Constraint violations
    if (message.includes('constraint') || message.includes('duplicate') || message.includes('unique')) {
      return new ValidationError(errorMessage, error);
    }
    
    // Network errors
    if (message.includes('network') || message.includes('fetch')) {
      return new AppError('Network error occurred', ErrorCode.NETWORK_ERROR, 503, error);
    }
    
    // Default to database error
    return new DatabaseError(errorMessage, error);
  }

  return new AppError('An unknown error occurred', ErrorCode.UNKNOWN_ERROR, 500, error);
}

/**
 * Type guard to check if error is AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
