import { Hono } from 'hono';
import { eq, desc, lt, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { products, inventoryLogs } from '../db/schema.js';
import { authMiddleware } from '../middleware/auth.js';

const inventoryRouter = new Hono();

// GET /api/inventory — admin: all products with stock info
inventoryRouter.get('/', authMiddleware, async (c) => {
  const { lowStock } = c.req.query();

  let query = db.select({
    id: products.id,
    name: products.name,
    slug: products.slug,
    sku: products.sku,
    stock: products.stock,
    lowStockThreshold: products.lowStockThreshold,
    status: products.status,
    brand: products.brand,
    images: products.images,
    categoryId: products.categoryId,
    updatedAt: products.updatedAt,
  }).from(products);

  if (lowStock === 'true') {
    const result = await db
      .select()
      .from(products)
      .where(lt(products.stock, products.lowStockThreshold!));
    return c.json({ success: true, data: result });
  }

  const result = await query.orderBy(desc(products.updatedAt));
  return c.json({ success: true, data: result });
});

// PUT /api/inventory/:productId — admin: adjust stock
inventoryRouter.put('/:productId', authMiddleware, async (c) => {
  const productId = parseInt(c.req.param('productId'));
  const { change, reason, reference } = await c.req.json();

  const [product] = await db.select().from(products).where(eq(products.id, productId));
  if (!product) return c.json({ success: false, message: 'Product not found' }, 404);

  const previousStock = product.stock;
  const newStock = Math.max(0, previousStock + change);

  await db.update(products)
    .set({ stock: newStock, updatedAt: new Date() })
    .where(eq(products.id, productId));

  await db.insert(inventoryLogs).values({
    productId,
    change,
    previousStock,
    newStock,
    reason: reason || 'Manual adjustment',
    reference,
    createdAt: new Date(),
  });

  return c.json({
    success: true,
    data: { productId, previousStock, newStock, change },
  });
});

// GET /api/inventory/:productId/logs — admin: stock history for a product
inventoryRouter.get('/:productId/logs', authMiddleware, async (c) => {
  const productId = parseInt(c.req.param('productId'));
  const logs = await db
    .select()
    .from(inventoryLogs)
    .where(eq(inventoryLogs.productId, productId))
    .orderBy(desc(inventoryLogs.createdAt))
    .limit(50);

  return c.json({ success: true, data: logs });
});

export default inventoryRouter;
