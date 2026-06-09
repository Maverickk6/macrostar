import { Hono } from 'hono';
import { eq, desc, and, ilike, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { orders, orderItems, products } from '../db/schema.js';
import { authMiddleware } from '../middleware/auth.js';
import { strictRateLimit } from '../middleware/rate-limit.js';

const ordersRouter = new Hono();

function generateOrderNumber(): string {
  const prefix = 'MST';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

// Apply rate limiting to order creation
ordersRouter.post('/', strictRateLimit, async (c) => {
  const body = await c.req.json();
  const { customer, items, shippingAddress, notes } = body;

  if (!items || items.length === 0) {
    return c.json({ success: false, message: 'Order must have at least one item' }, 400);
  }

  // Validate customer info
  if (!customer?.email || !customer?.name) {
    return c.json({ success: false, message: 'Customer name and email are required' }, 400);
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(customer.email)) {
    return c.json({ success: false, message: 'Invalid email format' }, 400);
  }

  // Validate products and calculate totals
  let subtotal = 0;
  const resolvedItems = [];

  for (const item of items) {
    const [product] = await db.select().from(products).where(eq(products.id, item.productId)).limit(1);
    if (!product) return c.json({ success: false, message: `Product ${item.productId} not found` }, 400);
    if (product.stock < item.quantity) {
      return c.json({ success: false, message: `Insufficient stock for ${product.name}` }, 400);
    }

    const itemTotal = parseFloat(product.price) * item.quantity;
    subtotal += itemTotal;
    resolvedItems.push({
      productId: product.id,
      productName: product.name,
      productImage: product.images?.[0] || null,
      sku: product.sku,
      quantity: item.quantity,
      unitPrice: product.price,
      total: itemTotal.toFixed(2),
    });
  }

  const shippingFee = subtotal > 0 ? 2500 : 0; // ₦2,500 flat shipping
  const total = subtotal + shippingFee;

  const [order] = await db.insert(orders).values({
    orderNumber: generateOrderNumber(),
    guestName: customer.name,
    guestEmail: customer.email,
    guestPhone: customer.phone,
    status: 'pending',
    paymentStatus: 'pending',
    subtotal: subtotal.toFixed(2),
    shippingFee: shippingFee.toFixed(2),
    total: total.toFixed(2),
    shippingAddress,
    notes,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning();

  // Insert order items
  await db.insert(orderItems).values(resolvedItems.map((item) => ({ ...item, orderId: order.id })));

  // Decrement stock
  for (const item of resolvedItems) {
    await db.update(products)
      .set({ stock: sql`${products.stock} - ${item.quantity}`, updatedAt: new Date() })
      .where(eq(products.id, item.productId!));
  }

  return c.json({ success: true, data: order }, 201);
});

// GET /api/orders — admin list with filters
ordersRouter.get('/', authMiddleware, async (c) => {
  const { status, search, page = '1', limit = '20', paymentStatus } = c.req.query();
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const offset = (pageNum - 1) * limitNum;

  const conditions = [];
  if (status) conditions.push(eq(orders.status, status as any));
  if (paymentStatus) conditions.push(eq(orders.paymentStatus, paymentStatus as any));
  if (search) {
    conditions.push(
      ilike(orders.guestEmail, `%${search}%`)
    );
  }

  const [allOrders, [{ count }]] = await Promise.all([
    db.select().from(orders)
      .where(and(...conditions))
      .orderBy(desc(orders.createdAt))
      .limit(limitNum)
      .offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(orders).where(and(...conditions)),
  ]);

  return c.json({
    success: true,
    data: allOrders,
    meta: { total: Number(count), page: pageNum, limit: limitNum, totalPages: Math.ceil(Number(count) / limitNum) },
  });
});

// GET /api/orders/:id — single order with items (public by order number OR admin by id)
ordersRouter.get('/:id', async (c) => {
  const { id } = c.req.param();

  // Try by order number first (public tracking), then by DB id (admin)
  let order;
  if (isNaN(Number(id))) {
    [order] = await db.select().from(orders).where(eq(orders.orderNumber, id)).limit(1);
  } else {
    [order] = await db.select().from(orders).where(eq(orders.id, parseInt(id))).limit(1);
  }

  if (!order) return c.json({ success: false, message: 'Order not found' }, 404);

  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));

  return c.json({ success: true, data: { ...order, items } });
});

// PUT /api/orders/:id/status — admin update order/delivery status
ordersRouter.put('/:id/status', authMiddleware, async (c) => {
  const id = parseInt(c.req.param('id') || '0');
  const { status, paymentStatus, trackingNumber, notes } = await c.req.json();

  const [existing] = await db.select().from(orders).where(eq(orders.id, id));
  if (!existing) return c.json({ success: false, message: 'Order not found' }, 404);

  const updateData: Record<string, any> = { updatedAt: new Date() };
  if (status) updateData.status = status;
  if (paymentStatus) updateData.paymentStatus = paymentStatus;
  if (trackingNumber) updateData.trackingNumber = trackingNumber;
  if (notes) updateData.notes = notes;
  if (status === 'delivered') updateData.deliveredAt = new Date();

  const [updated] = await db.update(orders).set(updateData).where(eq(orders.id, id)).returning();
  return c.json({ success: true, data: updated });
});

export default ordersRouter;
