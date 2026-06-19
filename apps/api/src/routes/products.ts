import { Hono } from 'hono';
import { eq, like, ilike, and, gte, lte, desc, asc, or, sql, inArray } from 'drizzle-orm';
import { db } from '../db/index.js';
import { products, categories, inventoryLogs } from '../db/schema.js';
import { authMiddleware, Env } from '../middleware/auth.js';

const productsRouter = new Hono<Env>();

// Helper function to generate SKU
function generateSKU(name: string, brand?: string | null): string {
  const prefix = 'MST';
  const code = brand
    ? brand.substring(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, '')
    : name.substring(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, '');
  const codePart = code || 'GEN';
  const randomNum = Math.floor(Math.random() * 900000) + 100000; // 6-digit number (100000-999999)
  return `${prefix}-${codePart}-${randomNum}`;
}

// Helper function to check if SKU exists in DB
async function skuExists(sku: string, excludeId?: number): Promise<boolean> {
  const conditions = [eq(products.sku, sku)];
  if (excludeId) {
    conditions.push(sql`${products.id} != ${excludeId}`);
  }
  const [existing] = await db.select({ id: products.id }).from(products).where(and(...conditions)).limit(1);
  return !!existing;
}

// Helper function to generate unique SKU with retry logic
async function generateUniqueSKU(name: string, brand?: string | null, excludeId?: number, maxAttempts: number = 20): Promise<string> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const candidateSKU = generateSKU(name, brand);
    const exists = await skuExists(candidateSKU, excludeId);
    if (!exists) {
      return candidateSKU;
    }
  }
  throw new Error(`Failed to generate unique SKU after ${maxAttempts} attempts`);
}

// Helper function to validate SKUs in batch for bulk inserts
async function validateSKUsInBatch(skus: string[]): Promise<{ valid: string[]; invalid: string[] }> {
  const existingSKUs = await db.select({ sku: products.sku }).from(products).where(inArray(products.sku, skus));
  const existingSet = new Set(existingSKUs.map(r => r.sku));
  return {
    valid: skus.filter(sku => !existingSet.has(sku)),
    invalid: skus.filter(sku => existingSet.has(sku)),
  };
}

// Helper function to generate slug and SKU for product
async function createProductIdentifiers(name: string, brand?: string | null, providedSlug?: string, providedSku?: string): Promise<{ slug: string; sku: string }> {
  const slug = providedSlug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const sku = providedSku || await generateUniqueSKU(name, brand);
  return { slug, sku };
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

  const { slug, sku } = await createProductIdentifiers(body.name, body.brand, body.slug, body.sku);

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

  // Generate unique SKU if SKU is being changed and not provided
  let sku = body.sku;
  if (body.name && !body.sku && body.name !== existing.name) {
    sku = await generateUniqueSKU(body.name, body.brand || existing.brand, id);
  }

  const [updated] = await db.update(products)
    .set({ ...body, sku, updatedAt: new Date() })
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

  // Guard: Reject batches exceeding safe maximum to prevent resource exhaustion
  if (productsData.length > 500) {
    return c.json({ success: false, message: 'Batch size cannot exceed 500 products' }, 400);
  }

  // Pre-generate SKUs for products that don't have them
  const productsWithSKUs = await Promise.all(
    productsData.map(async (productData: any) => ({
      ...productData,
      sku: productData.sku || await generateUniqueSKU(productData.name, productData.brand),
    }))
  );

  // Detect and resolve intra-batch SKU duplicates
  const skuMap = new Map<string, number[]>();
  productsWithSKUs.forEach((product, index) => {
    if (product.sku) {
      if (!skuMap.has(product.sku)) {
        skuMap.set(product.sku, []);
      }
      skuMap.get(product.sku)!.push(index);
    }
  });

  // Regenerate SKUs for duplicates within the batch
  const productsWithoutIntraDuplicates = await Promise.all(
    productsWithSKUs.map(async (productData: any, index: number) => {
      const duplicateIndices = skuMap.get(productData.sku);
      if (duplicateIndices && duplicateIndices.length > 1 && duplicateIndices[0] !== index) {
        // This is a duplicate (not the first occurrence), regenerate SKU
        return {
          ...productData,
          sku: await generateUniqueSKU(productData.name, productData.brand),
        };
      }
      return productData;
    })
  );

  // Validate SKUs in batch to check for conflicts with database
  const allSKUs = productsWithoutIntraDuplicates.map(p => p.sku).filter(Boolean);
  const { invalid: conflictingSKUs } = await validateSKUsInBatch(allSKUs);

  // Regenerate SKUs for any conflicts with database
  const finalProducts = await Promise.all(
    productsWithoutIntraDuplicates.map(async (productData: any) => {
      if (conflictingSKUs.includes(productData.sku)) {
        return {
          ...productData,
          sku: await generateUniqueSKU(productData.name, productData.brand),
        };
      }
      return productData;
    })
  );

  let results: any[] = [];
  const errors: any[] = [];

  try {
    await db.transaction(async (tx) => {
      for (let i = 0; i < finalProducts.length; i++) {
        const productData = finalProducts[i];
        
        // Validation: Check for required fields
        if (!productData.name || productData.price == null) {
          errors.push({ row: i + 1, error: 'Name and price are required fields', data: productData });
          continue;
        }
        
        try {
          const { slug } = await createProductIdentifiers(productData.name, productData.brand, productData.slug, productData.sku);

          const [existing] = await tx.select().from(products).where(eq(products.slug, slug));
          
          let product;
          if (existing) {
            const updateData: any = { updatedAt: new Date() };
            if (productData.price !== null && productData.price !== undefined) updateData.price = parseFloat(String(productData.price)).toFixed(2);
            if (productData.comparePrice !== null && productData.comparePrice !== undefined) updateData.comparePrice = parseFloat(String(productData.comparePrice)).toFixed(2);
            if (productData.stock !== null && productData.stock !== undefined) updateData.stock = productData.stock;
            if (productData.brand) updateData.brand = productData.brand;
            if (productData.sku) updateData.sku = productData.sku;
            if (productData.description) updateData.description = productData.description;
            if (productData.categoryId) updateData.categoryId = productData.categoryId;
            if (productData.shortDescription) updateData.shortDescription = productData.shortDescription;
            if (productData.status !== undefined) updateData.status = productData.status;
            if (productData.featured) updateData.featured = productData.featured;
            if (productData.lowStockThreshold !== undefined && typeof productData.lowStockThreshold === 'number') updateData.lowStockThreshold = productData.lowStockThreshold;

            if (Object.keys(updateData).length > 1) {
              [product] = await tx.update(products).set(updateData).where(eq(products.id, existing.id)).returning();
            } else {
              product = existing;
            }
          } else {
            [product] = await tx.insert(products).values({
              ...productData,
              slug,
              sku: productData.sku,
              price: productData.price != null ? parseFloat(String(productData.price)).toFixed(2) : undefined,
              comparePrice: productData.comparePrice != null ? parseFloat(String(productData.comparePrice)).toFixed(2) : undefined,
              createdAt: new Date(),
              updatedAt: new Date(),
            }).returning();
          }

          results.push({ success: true, data: product, row: i + 1 });
        } catch (rowErr: any) {
          console.error(`Error processing product at row ${i + 1}:`, rowErr);
          errors.push({
            row: i + 1,
            error: rowErr.message || String(rowErr),
            data: productData,
          });
        }
      }
    });

    if (errors.length > 0) {
      return c.json({
        success: false,
        message: `Bulk upload completed with errors: ${results.length} successful, ${errors.length} failed`,
        data: {
          successful: results,
          failed: errors,
        },
      }, 207); // Multi-status
    }

    return c.json({
      success: true,
      message: `Bulk upload completed: ${results.length} successful`,
      data: {
        successful: results,
      },
    });
  } catch (err: any) {
    console.error('Bulk upload transaction failed:', err);
    return c.json({
      success: false,
      message: 'Bulk upload failed due to a critical error. All changes have been rolled back.',
      error: err.message || String(err),
    }, 500);
  }
});

export default productsRouter;
