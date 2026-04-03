// Environment configuration: loads .env values and normalizes runtime settings for the whole app.
const dotenv = require('dotenv');

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction,
  port: Number(process.env.PORT) || 3000,
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  },
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'rongchuan_admin',
  },
  accessToken: {
    secret: process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET || 'change_this_to_a_secure_secret',
    expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || process.env.JWT_EXPIRES_IN || '2h',
    expiresInSeconds: Number(process.env.ACCESS_TOKEN_EXPIRES_IN_SECONDS) || 2 * 60 * 60,
  },
  refreshToken: {
    secret: process.env.REFRESH_TOKEN_SECRET || `${process.env.JWT_SECRET || 'change_this_to_a_secure_secret'}_refresh`,
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
    expiresInSeconds: Number(process.env.REFRESH_TOKEN_EXPIRES_IN_SECONDS) || 7 * 24 * 60 * 60,
  },
  refreshCookie: {
    name: process.env.REFRESH_COOKIE_NAME || process.env.AUTH_COOKIE_NAME || 'refreshToken',
    secure: process.env.REFRESH_COOKIE_SECURE
      ? process.env.REFRESH_COOKIE_SECURE === 'true'
      : process.env.AUTH_COOKIE_SECURE
        ? process.env.AUTH_COOKIE_SECURE === 'true'
      : isProduction,
    sameSite: process.env.REFRESH_COOKIE_SAME_SITE || process.env.AUTH_COOKIE_SAME_SITE || 'lax',
    domain: process.env.REFRESH_COOKIE_DOMAIN || process.env.AUTH_COOKIE_DOMAIN || undefined,
    path: process.env.REFRESH_COOKIE_PATH || '/api/auth',
    maxAge: Number(process.env.REFRESH_COOKIE_MAX_AGE) || Number(process.env.AUTH_COOKIE_MAX_AGE) || 7 * 24 * 60 * 60 * 1000,
  },
};
