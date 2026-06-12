import { Hono } from 'hono';
import { eq, and } from 'drizzle-orm';
import { db } from '../db/index.js';
import { cartItems, products } from '../db/schema.js';
import { authMiddleware } from '../middleware/auth.js';

const cart = new Hono();

// Apply auth middleware to all routes
cart.use('*', authMiddleware);

// GET /api/cart - Get customer's cart
cart.get('/', async (c) => {
  try {
    const payload = c.get('user') as { id: number; email: string; type: string };
    
    if (payload.type !== 'customer') {
      return c.json({ success: false, message: 'Only customers can access cart' }, 403);
    }

    const customerId = payload.id;

    const cart = await db
      .select({
        id: cartItems.id,
        productId: cartItems.productId,
        quantity: cartItems.quantity,
        productName: products.name,
        productSlug: products.slug,
        productPrice: products.price,
        productImage: products.images,
        productSku: products.sku,
        productStock: products.stock,
      })
      .from(cartItems)
      .leftJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.customerId, customerId));

    const items = cart.map((item) => ({
      id: item.productId,
      name: item.productName,
      slug: item.productSlug,
      price: item.productPrice?.toString() || '0',
      image: item.productImage?.[0] || null,
      sku: item.productSku,
      quantity: item.quantity,
      stock: item.productStock || 0,
    }));

    return c.json({ success: true, data: items });
  } catch (error) {
    console.error('Cart fetch error:', error);
    return c.json({ success: false, message: 'Failed to fetch cart' }, 500);
  }
});

// POST /api/cart - Add item to cart
cart.post('/', async (c) => {
  try {
    const payload = c.get('user') as { id: number; email: string; type: string };
    
    if (payload.type !== 'customer') {
      return c.json({ success: false, message: 'Only customers can access cart' }, 403);
    }

    const customerId = payload.id;
    const { productId, quantity = 1 } = await c.req.json();

    if (!productId) {
      return c.json({ success: false, message: 'Product ID required' }, 400);
    }

    // Check if product exists
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!product) {
      return c.json({ success: false, message: 'Product not found' }, 404);
    }

    // Check if item already in cart
    const [existingItem] = await db
      .select()
      .from(cartItems)
      .where(
        and(
          eq(cartItems.customerId, customerId),
          eq(cartItems.productId, productId)
        )
      )
      .limit(1);

    if (existingItem) {
      // Update quantity
      const newQuantity = Math.min(existingItem.quantity + quantity, product.stock);
      await db
        .update(cartItems)
        .set({ quantity: newQuantity, updatedAt: new Date() })
        .where(eq(cartItems.id, existingItem.id));
    } else {
      // Add new item
      await db.insert(cartItems).values({
        customerId,
        productId,
        quantity: Math.min(quantity, product.stock),
      });
    }

    return c.json({ success: true, message: 'Item added to cart' });
  } catch (error) {
    console.error('Cart add error:', error);
    return c.json({ success: false, message: 'Failed to add item to cart' }, 500);
  }
});

// PUT /api/cart/:productId - Update cart item quantity
cart.put('/:productId', async (c) => {
  try {
    const payload = c.get('user') as { id: number; email: string; type: string };
    
    if (payload.type !== 'customer') {
      return c.json({ success: false, message: 'Only customers can access cart' }, 403);
    }

    const customerId = payload.id;
    const productId = parseInt(c.req.param('productId'));
    const { quantity } = await c.req.json();

    if (!quantity || quantity < 1) {
      return c.json({ success: false, message: 'Quantity must be at least 1' }, 400);
    }

    // Check if item exists in cart
    const [existingItem] = await db
      .select()
      .from(cartItems)
      .where(
        and(
          eq(cartItems.customerId, customerId),
          eq(cartItems.productId, productId)
        )
      )
      .limit(1);

    if (!existingItem) {
      return c.json({ success: false, message: 'Item not found in cart' }, 404);
    }

    // Check product stock
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!product) {
      return c.json({ success: false, message: 'Product not found' }, 404);
    }

    const newQuantity = Math.min(quantity, product.stock);
    await db
      .update(cartItems)
      .set({ quantity: newQuantity, updatedAt: new Date() })
      .where(eq(cartItems.id, existingItem.id));

    return c.json({ success: true, message: 'Cart updated' });
  } catch (error) {
    console.error('Cart update error:', error);
    return c.json({ success: false, message: 'Failed to update cart' }, 500);
  }
});

// DELETE /api/cart/:productId - Remove item from cart
cart.delete('/:productId', async (c) => {
  try {
    const payload = c.get('user') as { id: number; email: string; type: string };
    
    if (payload.type !== 'customer') {
      return c.json({ success: false, message: 'Only customers can access cart' }, 403);
    }

    const customerId = payload.id;
    const productId = parseInt(c.req.param('productId'));

    await db
      .delete(cartItems)
      .where(
        and(
          eq(cartItems.customerId, customerId),
          eq(cartItems.productId, productId)
        )
      );

    return c.json({ success: true, message: 'Item removed from cart' });
  } catch (error) {
    console.error('Cart delete error:', error);
    return c.json({ success: false, message: 'Failed to remove item from cart' }, 500);
  }
});

// DELETE /api/cart - Clear entire cart
cart.delete('/', async (c) => {
  try {
    const payload = c.get('user') as { id: number; email: string; type: string };
    
    if (payload.type !== 'customer') {
      return c.json({ success: false, message: 'Only customers can access cart' }, 403);
    }

    const customerId = payload.id;

    await db
      .delete(cartItems)
      .where(eq(cartItems.customerId, customerId));

    return c.json({ success: true, message: 'Cart cleared' });
  } catch (error) {
    console.error('Cart clear error:', error);
    return c.json({ success: false, message: 'Failed to clear cart' }, 500);
  }
});

export default cart;
