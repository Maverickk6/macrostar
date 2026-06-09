import { Context, Next } from 'hono';

export async function securityHeaders(c: Context, next: Next) {
  await next();

  // Security headers
  c.res.headers.set('X-DNS-Prefetch-Control', 'off');
  c.res.headers.set('X-Frame-Options', 'DENY');
  c.res.headers.set('X-Content-Type-Options', 'nosniff');
  c.res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  c.res.headers.set('X-XSS-Protection', '1; mode=block');
  c.res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  c.res.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
}

export function requestSizeLimit(maxSize: number) {
  return async (c: Context, next: Next) => {
    const contentLength = c.req.header('content-length');
    if (contentLength && parseInt(contentLength) > maxSize) {
      return c.json(
        { success: false, message: 'Request body too large' },
        413
      );
    }
    await next();
  };
}

export const bodySizeLimit = requestSizeLimit(10 * 1024 * 1024); // 10MB limit
