import rateLimit from 'express-rate-limit';

/**
 * Rate limiter for sensitive authentication endpoints (Login, Register).
 * Prevents automated brute-force attacks and credential stuffing.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: process.env.NODE_ENV === 'production' ? 10 : 50, // 10 attempts in prod, 50 in dev/test
  standardHeaders: true, // Return standard RateLimit-* headers
  legacyHeaders: false, // Disable the legacy X-RateLimit-* headers
  message: {
    error: 'Too many attempts from this IP address. Please try again after 15 minutes.'
  }
});

/**
 * General API rate limiter for regular traffic protection
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300, // 300 requests per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests. Please slow down and try again later.'
  }
});
