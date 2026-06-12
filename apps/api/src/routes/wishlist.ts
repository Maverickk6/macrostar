import { Hono } from 'hono';
import { eq, and } from 'drizzle-orm';
import { db } from '../db/index.js';
import { wishlistItems, products } from '../db/schema.js';
import { authMiddleware } from '../middleware/auth.js';

const wishlist = new Hono();

// Apply auth middleware to all routes
wishlist.use('*', authMiddleware);

// GET /api/wishlist - Get customer's wishlist
wishlist.get('/', async (c) => {
  try {
    const payload = c.get('user') as { id: number; email: string; type: string };
    
    if (payload.type !== 'customer') {
      return c.json({ success: false, message: 'Only customers can access wishlist' }, 403);
    }

    const customerId = payload.id;

    const wishlist = await db
      .select({
        id: wishlistItems.id,
        productId: wishlistItems.productId,
        productName: products.name,
        productSlug: products.slug,
        productPrice: products.price,
        productImage: products.images,
        productSku: products.sku,
        productStock: products.stock,
      })
      .from(wishlistItems)
      .leftJoin(products, eq(wishlistItems.productId, products.id))
      .where(eq(wishlistItems.customerId, customerId));

    const items = wishlist.map((item) => ({
      id: item.productId,
      name: item.productName,
      slug: item.productSlug,
      price: item.productPrice?.toString() || '0',
      image: item.productImage?.[0] || null,
      sku: item.productSku,
      stock: item.productStock || 0,
    }));

    return c.json({ success: true, data: items });
  } catch (error) {
    console.error('Wishlist fetch error:', error);
    return c.json({ success: false, message: 'Failed to fetch wishlist' }, 500);
  }
});

// POST /api/wishlist - Add item to wishlist
wishlist.post('/', async (c) => {
  try {
    const payload = c.get('user') as { id: number; email: string; type: string };
    
    if (payload.type !== 'customer') {
      return c.json({ success: false, message: 'Only customers can access wishlist' }, 403);
    }

    const customerId = payload.id;
    const { productId } = await c.req.json();

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

    // Check if item already in wishlist
    const [existingItem] = await db
      .select()
      .from(wishlistItems)
      .where(
        and(
          eq(wishlistItems.customerId, customerId),
          eq(wishlistItems.productId, productId)
        )
      )
      .limit(1);

    if (existingItem) {
      return c.json({ success: false, message: 'Item already in wishlist' }, 400);
    }

    // Add new item
    await db.insert(wishlistItems).values({
      customerId,
      productId,
    });

    return c.json({ success: true, message: 'Item added to wishlist' });
  } catch (error) {
    console.error('Wishlist add error:', error);
    return c.json({ success: false, message: 'Failed to add item to wishlist' }, 500);
  }
});

// DELETE /api/wishlist/:productId - Remove item from wishlist
wishlist.delete('/:productId', async (c) => {
  try {
    const payload = c.get('user') as { id: number; email: string; type: string };
    
    if (payload.type !== 'customer') {
      return c.json({ success: false, message: 'Only customers can access wishlist' }, 403);
    }

    const customerId = payload.id;
    const productId = parseInt(c.req.param('productId'));

    await db
      .delete(wishlistItems)
      .where(
        and(
          eq(wishlistItems.customerId, customerId),
          eq(wishlistItems.productId, productId)
        )
      );

    return c.json({ success: true, message: 'Item removed from wishlist' });
  } catch (error) {
    console.error('Wishlist delete error:', error);
    return c.json({ success: false, message: 'Failed to remove item from wishlist' }, 500);
  }
});

// DELETE /api/wishlist - Clear entire wishlist
wishlist.delete('/', async (c) => {
  try {
    const payload = c.get('user') as { id: number; email: string; type: string };
    
    if (payload.type !== 'customer') {
      return c.json({ success: false, message: 'Only customers can access wishlist' }, 403);
    }

    const customerId = payload.id;

    await db
      .delete(wishlistItems)
      .where(eq(wishlistItems.customerId, customerId));

    return c.json({ success: true, message: 'Wishlist cleared' });
  } catch (error) {
    console.error('Wishlist clear error:', error);
    return c.json({ success: false, message: 'Failed to clear wishlist' }, 500);
  }
});

export default wishlist;
