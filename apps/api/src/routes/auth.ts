import { Hono } from 'hono';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { authMiddleware } from '../middleware/auth.js';
import { authRateLimit } from '../middleware/rate-limit.js';

const auth = new Hono();

// Apply rate limiting to login
auth.post('/login', authRateLimit, async (c) => {
  const body = await c.req.json();
  const { email, password } = body;

  if (!email || !password) {
    return c.json({ success: false, message: 'Email and password required' }, 400);
  }

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  if (!user) {
    return c.json({ success: false, message: 'Invalid credentials' }, 401);
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return c.json({ success: false, message: 'Invalid credentials' }, 401);
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: user.role === 'admin' ? '1h' : '7d' }
  );

  return c.json({
    success: true,
    data: {
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    },
  });
});

// GET /api/auth/me
auth.get('/me', authMiddleware, async (c) => {
  const payload = c.get('user') as { id: number; email: string; role: string };
  const [user] = await db.select({
    id: users.id,
    name: users.name,
    email: users.email,
    role: users.role,
    createdAt: users.createdAt,
  })
    .from(users)
    .where(eq(users.id, payload.id))
    .limit(1);

  if (!user) return c.json({ success: false, message: 'User not found' }, 404);

  return c.json({ success: true, data: user });
});

// PUT /api/auth/change-password — admin change password
auth.put('/change-password', authMiddleware, async (c) => {
  const payload = c.get('user') as { id: number; email: string; role: string };
  const { currentPassword, newPassword } = await c.req.json();

  if (!currentPassword || !newPassword) {
    return c.json({ success: false, message: 'Current and new password are required' }, 400);
  }

  if (newPassword.length < 6) {
    return c.json({ success: false, message: 'New password must be at least 6 characters' }, 400);
  }

  const [user] = await db.select().from(users).where(eq(users.id, payload.id)).limit(1);

  if (!user) return c.json({ success: false, message: 'User not found' }, 404);

  const isValid = await bcrypt.compare(currentPassword, user.password);
  if (!isValid) {
    return c.json({ success: false, message: 'Current password is incorrect' }, 401);
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await db.update(users)
    .set({ password: hashedPassword, updatedAt: new Date() })
    .where(eq(users.id, payload.id));

  return c.json({ success: true, message: 'Password changed successfully' });
});

export default auth;
