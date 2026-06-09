import 'dotenv/config';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

import authRouter from '../routes/auth.js';
import customerAuthRouter from '../routes/customer-auth.js';
import customerOrderRouter from '../routes/customer-orders.js';
import reviewsRouter from '../routes/reviews.js';
import couponsRouter from '../routes/coupons.js';
import shippingRouter from '../routes/shipping.js';
import productsRouter from '../routes/products.js';
import categoriesRouter from '../routes/categories.js';
import ordersRouter from '../routes/orders.js';
import paymentsRouter from '../routes/payments.js';
import inventoryRouter from '../routes/inventory.js';
import analyticsRouter from '../routes/analytics.js';
import settingsRouter from '../routes/settings.js';
import contactRouter from '../routes/contact.js';

const app = new Hono();

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use('*', logger());
app.use(
  '*',
  cors({
    origin: [
      'http://localhost:3000', // store
      'http://localhost:3001', // admin
      process.env.STORE_URL || '',
      process.env.ADMIN_URL || '',
    ].filter(Boolean),
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  })
);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/', (c) => c.json({
  service: 'MacroStar Technologies API',
  version: '1.0.0',
  status: 'running',
  timestamp: new Date().toISOString(),
}));

// ─── API Routes ──────────────────────────────────────────────────────────────
app.route('/api/auth', authRouter);
app.route('/api/auth/customer', customerAuthRouter);
app.route('/api/orders/customer', customerOrderRouter);
app.route('/api/reviews', reviewsRouter);
app.route('/api/coupons', couponsRouter);
app.route('/api/shipping', shippingRouter);
app.route('/api/products', productsRouter);
app.route('/api/categories', categoriesRouter);
app.route('/api/orders', ordersRouter);
app.route('/api/payments', paymentsRouter);
app.route('/api/inventory', inventoryRouter);
app.route('/api/analytics', analyticsRouter);
app.route('/api/settings', settingsRouter);
app.route('/api/contact', contactRouter);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.notFound((c) => c.json({ success: false, message: 'Route not found' }, 404));

// ─── Error Handler ────────────────────────────────────────────────────────────
app.onError((err, c) => {
  console.error('API Error:', err);
  return c.json({ success: false, message: 'Internal server error' }, 500);
});

export default app;
