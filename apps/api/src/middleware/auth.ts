import { Context, Next } from 'hono';
import jwt from 'jsonwebtoken';

export interface JWTPayload {
  id: number;
  email: string;
  role: string;
}

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, message: 'Unauthorized — missing token' }, 401);
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    c.set('user', payload);
    await next();
  } catch {
    return c.json({ success: false, message: 'Unauthorized — invalid or expired token' }, 401);
  }
}
