import { Hono } from 'hono';
import { desc, gte, sql, eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { orders, products, orderItems, categories } from '../db/schema.js';
import { authMiddleware } from '../middleware/auth.js';

const analyticsRouter = new Hono();

// GET /api/analytics/summary — dashboard overview cards
analyticsRouter.get('/summary', authMiddleware, async (c) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfToday = new Date(now.setHours(0, 0, 0, 0));

  const [
    totalOrders,
    totalRevenue,
    monthOrders,
    monthRevenue,
    todayOrders,
    todayRevenue,
    totalProducts,
    lowStockCount,
    pendingOrders,
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(orders),
    db.select({ sum: sql<number>`coalesce(sum(total::numeric), 0)` }).from(orders).where(eq(orders.paymentStatus, 'paid')),
    db.select({ count: sql<number>`count(*)` }).from(orders).where(gte(orders.createdAt, startOfMonth)),
    db.select({ sum: sql<number>`coalesce(sum(total::numeric), 0)` }).from(orders).where(gte(orders.createdAt, startOfMonth)),
    db.select({ count: sql<number>`count(*)` }).from(orders).where(gte(orders.createdAt, startOfToday)),
    db.select({ sum: sql<number>`coalesce(sum(total::numeric), 0)` }).from(orders).where(gte(orders.createdAt, startOfToday)),
    db.select({ count: sql<number>`count(*)` }).from(products),
    db.select({ count: sql<number>`count(*)` }).from(products).where(sql`${products.stock} <= ${products.lowStockThreshold}`),
    db.select({ count: sql<number>`count(*)` }).from(orders).where(eq(orders.status, 'pending')),
  ]);

  return c.json({
    success: true,
    data: {
      totalOrders: Number(totalOrders[0].count),
      totalRevenue: Number(totalRevenue[0].sum),
      monthOrders: Number(monthOrders[0].count),
      monthRevenue: Number(monthRevenue[0].sum),
      todayOrders: Number(todayOrders[0].count),
      todayRevenue: Number(todayRevenue[0].sum),
      totalProducts: Number(totalProducts[0].count),
      lowStockCount: Number(lowStockCount[0].count),
      pendingOrders: Number(pendingOrders[0].count),
    },
  });
});

// GET /api/analytics/sales — sales chart data (last 30 days by default)
analyticsRouter.get('/sales', authMiddleware, async (c) => {
  const { days = '30' } = c.req.query();
  const daysNum = parseInt(days);
  const since = new Date();
  since.setDate(since.getDate() - daysNum);

  const salesData = await db
    .select({
      date: sql<string>`date_trunc('day', ${orders.createdAt})::date`,
      orders: sql<number>`count(*)`,
      revenue: sql<number>`coalesce(sum(${orders.total}::numeric), 0)`,
    })
    .from(orders)
    .where(gte(orders.createdAt, since))
    .groupBy(sql`date_trunc('day', ${orders.createdAt})::date`)
    .orderBy(sql`date_trunc('day', ${orders.createdAt})::date`);

  return c.json({ success: true, data: salesData });
});

// GET /api/analytics/top-products — best selling products
analyticsRouter.get('/top-products', authMiddleware, async (c) => {
  const { limit = '10' } = c.req.query();

  const topProducts = await db
    .select({
      productId: orderItems.productId,
      productName: orderItems.productName,
      totalSold: sql<number>`sum(${orderItems.quantity})`,
      totalRevenue: sql<number>`sum(${orderItems.total}::numeric)`,
    })
    .from(orderItems)
    .groupBy(orderItems.productId, orderItems.productName)
    .orderBy(desc(sql`sum(${orderItems.quantity})`))
    .limit(parseInt(limit));

  return c.json({ success: true, data: topProducts });
});

// GET /api/analytics/orders-by-status — order status breakdown
analyticsRouter.get('/orders-by-status', authMiddleware, async (c) => {
  const breakdown = await db
    .select({
      status: orders.status,
      count: sql<number>`count(*)`,
    })
    .from(orders)
    .groupBy(orders.status);

  return c.json({ success: true, data: breakdown });
});

// GET /api/analytics/recent-orders — for dashboard table
analyticsRouter.get('/recent-orders', authMiddleware, async (c) => {
  const { limit = '5' } = c.req.query();
  const recent = await db
    .select()
    .from(orders)
    .orderBy(desc(orders.createdAt))
    .limit(parseInt(limit));

  return c.json({ success: true, data: recent });
});

export default analyticsRouter;
