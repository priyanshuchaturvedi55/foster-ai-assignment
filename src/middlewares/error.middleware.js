const env = require('../config/env');
const ApiError = require('../utils/ApiError');

const errorHandler = (err, req, res, next) => {
  let error = err;

  // Handle Mongoose Bad ObjectId (CastError)
  if (err.name === 'CastError') {
    const message = `Resource not found with id: ${err.value}`;
    error = new ApiError(404, message);
  }

  // Handle Mongoose duplicate key error (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const message = `An account or record with this ${field} already exists.`;
    error = new ApiError(409, message);
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    const errorDetails = Object.values(err.errors).map((val) => ({
      field: val.path,
      message: val.message
    }));
    error = new ApiError(400, 'Database Validation Error', errorDetails);
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = new ApiError(401, 'Invalid authentication token');
  }

  if (err.name === 'TokenExpiredError') {
    error = new ApiError(401, 'Authentication token has expired');
  }

  // Ensure default ApiError structure
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';
  const errors = error.errors || [];

  const responsePayload = {
    success: false,
    statusCode,
    message,
    ...(errors.length > 0 && { errors }),
    ...(env.NODE_ENV === 'development' && { stack: error.stack })
  };

  if (statusCode >= 500) {
    console.error(`[Unhandled Error] ${req.method} ${req.originalUrl}:`, err);
  }

  return res.status(statusCode).json(responsePayload);
};

const notFoundHandler = (req, res, next) => {
  next(new ApiError(404, `Endpoint not found: ${req.method} ${req.originalUrl}`));
};

module.exports = {
  errorHandler,
  notFoundHandler
};

