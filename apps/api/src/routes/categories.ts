import { Hono } from 'hono';
import { eq, desc, asc } from 'drizzle-orm';
import { db } from '../db/index.js';
import { categories } from '../db/schema.js';
import { authMiddleware } from '../middleware/auth.js';

const categoriesRouter = new Hono();

// GET /api/categories — public
categoriesRouter.get('/', async (c) => {
  const all = await db
    .select()
    .from(categories)
    .where(eq(categories.isActive, true))
    .orderBy(asc(categories.sortOrder));

  // Build tree
  const roots = all.filter((c) => !c.parentId);
  const children = all.filter((c) => c.parentId);

  const tree = roots.map((root) => ({
    ...root,
    children: children.filter((child) => child.parentId === root.id),
  }));

  return c.json({ success: true, data: tree });
});

// GET /api/categories/flat — all flat list (for admin dropdowns)
categoriesRouter.get('/flat', async (c) => {
  const all = await db.select().from(categories).orderBy(asc(categories.sortOrder));
  return c.json({ success: true, data: all });
});

// GET /api/categories/:slug — single category
categoriesRouter.get('/:slug', async (c) => {
  const { slug } = c.req.param();
  const [cat] = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
  if (!cat) return c.json({ success: false, message: 'Category not found' }, 404);
  return c.json({ success: true, data: cat });
});

// POST /api/categories — admin create
categoriesRouter.post('/', authMiddleware, async (c) => {
  const body = await c.req.json();
  const slug = body.slug || body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const [cat] = await db.insert(categories).values({
    ...body,
    slug,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning();

  return c.json({ success: true, data: cat }, 201);
});

// PUT /api/categories/:id — admin update
categoriesRouter.put('/:id', authMiddleware, async (c) => {
  const id = parseInt(c.req.param('id'));
  const body = await c.req.json();

  const [existing] = await db.select().from(categories).where(eq(categories.id, id));
  if (!existing) return c.json({ success: false, message: 'Category not found' }, 404);

  const [updated] = await db.update(categories)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(categories.id, id))
    .returning();

  return c.json({ success: true, data: updated });
});

// DELETE /api/categories/:id — admin delete
categoriesRouter.delete('/:id', authMiddleware, async (c) => {
  const id = parseInt(c.req.param('id'));

  const [existing] = await db.select().from(categories).where(eq(categories.id, id));
  if (!existing) return c.json({ success: false, message: 'Category not found' }, 404);

  await db.delete(categories).where(eq(categories.id, id));
  return c.json({ success: true, message: 'Category deleted' });
});

export default categoriesRouter;
