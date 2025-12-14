/**
 * Error Handler Middleware
 * 
 * Centralized error handling for the application.
 * Provides consistent error response format.
 */

/**
 * Custom API Error class
 */
export class ApiError extends Error {
  constructor(statusCode, message, code = 'ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Not Found Handler
 * Catches requests to undefined routes
 */
export const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    code: 'ROUTE_NOT_FOUND'
  });
};

/**
 * Global Error Handler
 * Catches all errors and returns consistent response
 */
export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let code = err.code || 'INTERNAL_ERROR';
  
  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', {
      message: err.message,
      stack: err.stack,
      statusCode,
      code
    });
  }
  
  // MongoDB duplicate key error
  if (err.code === 11000) {
    statusCode = 409;
    message = 'Duplicate entry found';
    code = 'DUPLICATE_ENTRY';
  }
  
  // MongoDB validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = err.message;
    code = 'VALIDATION_ERROR';
  }
  
  // MongoDB CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
    code = 'INVALID_ID';
  }
  
  res.status(statusCode).json({
    success: false,
    message,
    code,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

/**
 * Async Handler Wrapper
 * Wraps async route handlers to catch errors
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
