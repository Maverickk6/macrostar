import { Hono } from 'hono';
import { eq, like, ilike, and, gte, lte, desc, asc, or, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { products, categories, inventoryLogs } from '../db/schema.js';
import { authMiddleware } from '../middleware/auth.js';

const productsRouter = new Hono();

// Helper function to generate SKU
function generateSKU(name: string, brand?: string | null): string {
  const prefix = 'MST';
  const code = brand 
    ? brand.substring(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, '')
    : name.substring(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, '');
  const codePart = code || 'GEN';
  const randomNum = Math.floor(Math.random() * 900) + 100; // 3-digit number (100-999)
  return `${prefix}-${codePart}-${randomNum}`;
}

// GET /api/products — public list with filters
productsRouter.get('/', async (c) => {
  const {
    category,
    search,
    minPrice,
    maxPrice,
    featured,
    status = 'active',
    sortBy = 'createdAt',
    sortOrder = 'desc',
    page = '1',
    limit = '12',
    brand,
    inStock,
  } = c.req.query();

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const offset = (pageNum - 1) * limitNum;

  const conditions = [];

  if (status && status !== 'all') conditions.push(eq(products.status, status as any));
  if (featured === 'true') conditions.push(eq(products.featured, true));
  if (brand) conditions.push(ilike(products.brand, `%${brand}%`));
  if (inStock === 'true') conditions.push(gte(products.stock, 1));
  if (search) {
    conditions.push(or(
      ilike(products.name, `%${search}%`),
      ilike(products.description, `%${search}%`),
      ilike(products.brand, `%${search}%`)
    ));
  }
  if (minPrice) conditions.push(gte(products.price, minPrice));
  if (maxPrice) conditions.push(lte(products.price, maxPrice));

  if (category) {
    const [cat] = await db.select({ id: categories.id }).from(categories).where(eq(categories.slug, category));
    if (cat) conditions.push(eq(products.categoryId, cat.id));
  }

  const orderFn = sortOrder === 'asc' ? asc : desc;
  const orderCol = sortBy === 'price' ? products.price
    : sortBy === 'name' ? products.name
    : products.createdAt;

  const [allProducts, [{ count }]] = await Promise.all([
    db.select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      shortDescription: products.shortDescription,
      price: products.price,
      comparePrice: products.comparePrice,
      stock: products.stock,
      sku: products.sku,
      images: products.images,
      featured: products.featured,
      status: products.status,
      brand: products.brand,
      categoryId: products.categoryId,
      createdAt: products.createdAt,
    })
      .from(products)
      .where(and(...conditions))
      .orderBy(orderFn(orderCol))
      .limit(limitNum)
      .offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(products).where(and(...conditions)),
  ]);

  return c.json({
    success: true,
    data: allProducts,
    meta: {
      total: Number(count),
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(Number(count) / limitNum),
    },
  });
});

// GET /api/products/:slug — public single product
productsRouter.get('/:slug', async (c) => {
  const { slug } = c.req.param();

  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.slug, slug))
    .limit(1);

  if (!product) return c.json({ success: false, message: 'Product not found' }, 404);

  const category = product.categoryId
    ? await db.select().from(categories).where(eq(categories.id, product.categoryId)).limit(1)
    : [];

  return c.json({ success: true, data: { ...product, category: category[0] || null } });
});

// POST /api/products — admin create
productsRouter.post('/', authMiddleware, async (c) => {
  const body = await c.req.json();

  const slug = body.slug || body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const sku = body.sku || generateSKU(body.name, body.brand);

  const [product] = await db.insert(products).values({
    ...body,
    slug,
    sku,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning();

  return c.json({ success: true, data: product }, 201);
});

// PUT /api/products/:id — admin update
productsRouter.put('/:id', authMiddleware, async (c) => {
  const id = parseInt(c.req.param('id'));
  const body = await c.req.json();

  const [existing] = await db.select().from(products).where(eq(products.id, id));
  if (!existing) return c.json({ success: false, message: 'Product not found' }, 404);

  // Track inventory change if stock changed
  if (body.stock !== undefined && body.stock !== existing.stock) {
    const change = (body.stock as number) - existing.stock;
    await db.insert(inventoryLogs).values({
      productId: id,
      change,
      previousStock: existing.stock,
      newStock: body.stock,
      reason: 'Manual update',
    });
  }

  const [updated] = await db.update(products)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(products.id, id))
    .returning();

  return c.json({ success: true, data: updated });
});

// DELETE /api/products/:id — admin delete
productsRouter.delete('/:id', authMiddleware, async (c) => {
  const id = parseInt(c.req.param('id'));

  const [existing] = await db.select().from(products).where(eq(products.id, id));
  if (!existing) return c.json({ success: false, message: 'Product not found' }, 404);

  await db.delete(products).where(eq(products.id, id));
  return c.json({ success: true, message: 'Product deleted' });
});

// POST /api/products/bulk — admin bulk create
productsRouter.post('/bulk', authMiddleware, async (c) => {
  const body = await c.req.json();
  const { products: productsData } = body;

  if (!Array.isArray(productsData) || productsData.length === 0) {
    return c.json({ success: false, message: 'Products array is required' }, 400);
  }

  const results = [];
  const errors = [];

  for (let i = 0; i < productsData.length; i++) {
    const productData = productsData[i];
    try {
      const slug = productData.slug || productData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const sku = productData.sku || generateSKU(productData.name, productData.brand);

      const [existing] = await db.select().from(products).where(eq(products.slug, slug));
      
      let product;
      if (existing) {
        const updateData: any = { updatedAt: new Date() };
        if (productData.price > 0) updateData.price = productData.price;
        if (productData.comparePrice !== null && productData.comparePrice !== undefined) updateData.comparePrice = productData.comparePrice;
        if (productData.stock > 0) updateData.stock = productData.stock;
        if (productData.brand) updateData.brand = productData.brand;
        if (productData.sku) updateData.sku = productData.sku;
        if (productData.description) updateData.description = productData.description;
        if (productData.categoryId) updateData.categoryId = productData.categoryId;
        if (productData.shortDescription) updateData.shortDescription = productData.shortDescription;
        if (productData.status && productData.status !== 'active') updateData.status = productData.status;
        if (productData.featured) updateData.featured = productData.featured;
        if (productData.lowStockThreshold && productData.lowStockThreshold !== 5) updateData.lowStockThreshold = productData.lowStockThreshold;

        if (Object.keys(updateData).length > 1) {
          [product] = await db.update(products).set(updateData).where(eq(products.id, existing.id)).returning();
        } else {
          product = existing;
        }
      } else {
        [product] = await db.insert(products).values({
          ...productData,
          slug,
          sku,
          createdAt: new Date(),
          updatedAt: new Date(),
        }).returning();
      }

      results.push({ success: true, data: product, row: i + 1 });
    } catch (err) {
      console.error(`Error inserting product at row ${i + 1}:`, err);
      errors.push({ row: i + 1, error: 'Failed to insert product', data: productData });
    }
  }

  return c.json({
    success: true,
    message: `Bulk upload completed: ${results.length} successful, ${errors.length} failed`,
    data: {
      successful: results,
      failed: errors,
    },
  });
});

export default productsRouter;
