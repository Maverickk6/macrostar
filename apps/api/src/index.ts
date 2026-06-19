import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

// Load .env from root directory (for local development)
// In production (Vercel), environment variables are automatically injected
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../..');
const envPath = path.join(rootDir, '.env');

if (existsSync(envPath)) {
  const result = dotenv.config({ path: envPath });
  if (result.error) {
    console.error('Error loading .env:', result.error);
  }
}

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

import authRouter from './routes/auth.js';
import customerAuthRouter from './routes/customer-auth.js';
import customerOrderRouter from './routes/customer-orders.js';
import reviewsRouter from './routes/reviews.js';
import couponsRouter from './routes/coupons.js';
import shippingRouter from './routes/shipping.js';
import productsRouter from './routes/products.js';
import categoriesRouter from './routes/categories.js';
import ordersRouter from './routes/orders.js';
import paymentsRouter from './routes/payments.js';
import inventoryRouter from './routes/inventory.js';
import analyticsRouter from './routes/analytics.js';
import settingsRouter from './routes/settings.js';
import contactRouter from './routes/contact.js';
import uploadRouter from './routes/upload.js';
import customersRouter from './routes/customers.js';
import cartRouter from './routes/cart.js';
import wishlistRouter from './routes/wishlist.js';
import { securityHeaders, requestSizeLimit } from './middleware/security.js';
import { generalRateLimit } from './middleware/rate-limit.js';

const app = new Hono();

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use('*', logger());
app.use('*', securityHeaders);
app.use('*', requestSizeLimit(10 * 1024 * 1024)); // 10MB limit
app.use('*', generalRateLimit);
app.use(
  '*',
  cors({
    origin: function (origin) {
      // Allow requests with no origin (like mobile apps, curl, etc.)
      if (!origin) return true;

      // Allow localhost for development
      if (origin.includes('localhost')) return origin;

      // Allow production URLs from environment variables
      const allowedOrigins = [
        process.env.STORE_URL,
        process.env.ADMIN_URL,
      ].filter(Boolean);

      if (allowedOrigins.some(allowed => origin === allowed)) {
        return origin;
      }

      return false;
    },
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  })
);

// ─── Static file serving (uploaded images) ───────────────────────────────────
// Note: Static file serving disabled for Vercel serverless deployment
// Images should be served from Cloudinary or similar CDN
// app.use('/uploads/*', serveStatic({ root: './' }));

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
app.route('/api/upload', uploadRouter);
app.route('/api/customers', customersRouter);
app.route('/api/cart', cartRouter);
app.route('/api/wishlist', wishlistRouter);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.notFound((c) => c.json({ success: false, message: 'Route not found' }, 404));

// ─── Error Handler ────────────────────────────────────────────────────────────
app.onError((err, c) => {
  console.error('API Error:', err);
  return c.json({ success: false, message: 'Internal server error' }, 500);
});

// ─── Export for Vercel ─────────────────────────────────────────────────────────
export default app;
