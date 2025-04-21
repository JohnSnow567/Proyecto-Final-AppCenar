class AppError extends Error {
    constructor(message, statusCode, isOperational = true) {
      super(message);
      this.statusCode = statusCode;
      this.isOperational = isOperational;
      Error.captureStackTrace(this, this.constructor);
    }
  }
  
  class DBError extends AppError {
    constructor(message, originalError) {
      super(message || 'Database operation failed', 500);
      this.originalError = originalError;
      this.isOperational = false;
    }
  }
  
  module.exports = { AppError, DBError };