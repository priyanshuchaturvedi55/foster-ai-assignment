const rateLimit = require('express-rate-limit');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(new ApiError(429, 'Too many requests from this IP, please try again later.'));
  }
});

// Strict rate limiter for public lead enquiry submissions (anti-spam)
const publicEnquiryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.PUBLIC_LEAD_RATE_LIMIT_MAX, // max 30 lead submissions per 15 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(new ApiError(429, 'Too many enquiry submissions from this IP. Please wait before submitting again.'));
  }
});

module.exports = {
  apiLimiter,
  publicEnquiryLimiter
};
