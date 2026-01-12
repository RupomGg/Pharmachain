import rateLimit from 'express-rate-limit';

/**
 * Rate Limiting Middleware
 * 
 * Prevents API abuse and protects against:
 * - Competitor scraping
 * - DDoS attacks
 * - Resource exhaustion
 */

/**
 * General API rate limiter
 * 100 requests per 15 minutes
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Relaxed from 100 for dev/testing
  message: {
    error: 'Too many requests from this IP, please try again later',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
});

/**
 * Strict rate limiter for expensive trace endpoint
 * 10 requests per minute
 */
export const traceLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: {
    error: 'Trace endpoint rate limit exceeded. This is an expensive operation.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Custom key generator (can be used for API key-based limiting)
  keyGenerator: (req) => {
    return req.headers['x-api-key'] || req.ip;
  }
});

/**
 * Moderate rate limiter for batch queries
 * 30 requests per minute
 */
export const batchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: {
    error: 'Batch query rate limit exceeded',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Lenient rate limiter for metadata validation
 * 50 requests per minute
 */
export const metadataLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 50,
  message: {
    error: 'Metadata validation rate limit exceeded',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false
});
