import { Context, Next } from 'hono';

interface RateLimitStore {
  count: number;
  resetTime: number;
}

const store = new Map<string, RateLimitStore>();

export function rateLimit(options: {
  windowMs: number;
  max: number;
  skipSuccessfulRequests?: boolean;
}) {
  return async (c: Context, next: Next) => {
    const key = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';
    const now = Date.now();
    const windowStart = now - options.windowMs;

    // Clean up old entries
    for (const [k, v] of store.entries()) {
      if (v.resetTime < windowStart) {
        store.delete(k);
      }
    }

    const record = store.get(key) || { count: 0, resetTime: now + options.windowMs };

    if (record.resetTime < windowStart) {
      record.count = 0;
      record.resetTime = now + options.windowMs;
    }

    record.count++;
    store.set(key, record);

    if (record.count > options.max) {
      return c.json(
        {
          success: false,
          message: 'Too many requests, please try again later',
        },
        429
      );
    }

    await next();

    // Skip successful requests if configured
    if (options.skipSuccessfulRequests && c.res.status < 400) {
      const updated = store.get(key);
      if (updated) {
        updated.count--;
        store.set(key, updated);
      }
    }
  };
}

// Pre-configured rate limiters
export const authRateLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 50, skipSuccessfulRequests: true }); // 50 requests per 15 minutes for development
export const generalRateLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }); // 100 requests per 15 minutes
export const strictRateLimit = rateLimit({ windowMs: 60 * 1000, max: 10 }); // 10 requests per minute
