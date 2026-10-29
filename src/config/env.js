const dotenv = require('dotenv');

dotenv.config();

const env = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGO_URI: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/foster_crm',
  JWT_SECRET: process.env.JWT_SECRET || 'supersecret_foster_ai_crm_jwt_key_2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
  PUBLIC_LEAD_RATE_LIMIT_MAX: parseInt(process.env.PUBLIC_LEAD_RATE_LIMIT_MAX, 10) || 30
};

module.exports = env;
