import { Hono } from 'hono';
import { eq, desc } from 'drizzle-orm';
import { db } from '../db/index.js';
import { orders, customers } from '../db/schema.js';

const customerOrderRouter = new Hono();

// Middleware to verify JWT token
const verifyToken = async (token: string) => {
  try {
    // This is a basic verification - in production, use proper JWT verification
    if (!token || token === 'undefined') {
      throw new Error('No token provided');
    }
    return true;
  } catch (error) {
    throw new Error('Invalid token');
  }
};

// GET /api/orders/my-orders - Get all orders for the authenticated customer
customerOrderRouter.get('/my-orders', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ error: 'Missing authorization header' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    await verifyToken(token);

    // Extract customer ID from token (in production, decode JWT properly)
    // For now, we'll get it from the request body or query params
    const customerId = c.req.query('customerId');
    
    if (!customerId) {
      return c.json({ error: 'Customer ID required' }, 400);
    }

    const customerOrders = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        customerId: orders.customerId,
        status: orders.status,
        paymentStatus: orders.paymentStatus,
        total: orders.total,
        subtotal: orders.subtotal,
        shippingFee: orders.shippingFee,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
        shippingAddress: orders.shippingAddress,
        billingAddress: orders.billingAddress,
        trackingNumber: orders.trackingNumber,
        estimatedDelivery: orders.estimatedDelivery,
      })
      .from(orders)
      .where(eq(orders.customerId, parseInt(customerId)))
      .orderBy(desc(orders.createdAt));

    return c.json(customerOrders);
  } catch (error: any) {
    console.error('Error fetching customer orders:', error);
    return c.json(
      { error: error.message || 'Failed to fetch orders' },
      500
    );
  }
});

// GET /api/orders/:id - Get single order details
customerOrderRouter.get('/:id', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ error: 'Missing authorization header' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    await verifyToken(token);

    const orderId = c.req.param('id');
    
    const order = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        customerId: orders.customerId,
        status: orders.status,
        paymentStatus: orders.paymentStatus,
        total: orders.total,
        subtotal: orders.subtotal,
        shippingFee: orders.shippingFee,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
        shippingAddress: orders.shippingAddress,
        billingAddress: orders.billingAddress,
        paymentMethod: orders.paymentMethod,
        trackingNumber: orders.trackingNumber,
        estimatedDelivery: orders.estimatedDelivery,
        deliveredAt: orders.deliveredAt,
      })
      .from(orders)
      .where(eq(orders.id, parseInt(orderId)))
      .limit(1);

    if (order.length === 0) {
      return c.json({ error: 'Order not found' }, 404);
    }

    return c.json(order[0]);
  } catch (error: any) {
    console.error('Error fetching order:', error);
    return c.json(
      { error: error.message || 'Failed to fetch order' },
      500
    );
  }
});

export default customerOrderRouter;
