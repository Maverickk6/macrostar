import { Hono } from 'hono';
import { eq, desc, like, or, inArray, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { customers } from '../db/schema.js';
import { authMiddleware } from '../middleware/auth.js';

const customersRouter = new Hono();

// GET /api/customers — admin only: list all customers
customersRouter.get('/', authMiddleware, async (c) => {
  const { search, page = '1', limit = '20' } = c.req.query();

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const offset = (pageNum - 1) * limitNum;

  const conditions = [];

  if (search) {
    conditions.push(or(
      like(customers.name, `%${search}%`),
      like(customers.email, `%${search}%`),
      like(customers.phone, `%${search}%`)
    ));
  }

  const [allCustomers, [{ totalCount }]] = await Promise.all([
    db.select({
      id: customers.id,
      name: customers.name,
      email: customers.email,
      phone: customers.phone,
      avatar: customers.avatar,
      address: customers.address,
      isActive: customers.isActive,
      lastLoginAt: customers.lastLoginAt,
      createdAt: customers.createdAt,
      updatedAt: customers.updatedAt,
    })
      .from(customers)
      .where(conditions.length > 0 ? or(...conditions) : undefined)
      .orderBy(desc(customers.createdAt))
      .limit(limitNum)
      .offset(offset),
    db.select({ totalCount: sql<number>`count(*)::int` })
      .from(customers)
      .where(conditions.length > 0 ? or(...conditions) : undefined),
  ]);

  return c.json({
    success: true,
    data: allCustomers,
    meta: {
      total: totalCount,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(totalCount / limitNum),
    },
  });
});

// GET /api/customers/:id — admin only: get single customer
customersRouter.get('/:id', authMiddleware, async (c) => {
  const id = parseInt(c.req.param('id'));

  const [customer] = await db
    .select({
      id: customers.id,
      name: customers.name,
      email: customers.email,
      phone: customers.phone,
      avatar: customers.avatar,
      address: customers.address,
      isActive: customers.isActive,
      lastLoginAt: customers.lastLoginAt,
      createdAt: customers.createdAt,
      updatedAt: customers.updatedAt,
    })
    .from(customers)
    .where(eq(customers.id, id))
    .limit(1);

  if (!customer) return c.json({ success: false, message: 'Customer not found' }, 404);

  return c.json({ success: true, data: customer });
});

// PUT /api/customers/:id — admin only: update customer
customersRouter.put('/:id', authMiddleware, async (c) => {
  const id = parseInt(c.req.param('id'));
  const body = await c.req.json();

  const [existing] = await db.select().from(customers).where(eq(customers.id, id));
  if (!existing) return c.json({ success: false, message: 'Customer not found' }, 404);

  // Whitelist of admin-editable fields (exclude protected fields: id, createdAt, password)
  const allowedFields = {
    name: body.name,
    email: body.email,
    phone: body.phone,
    avatar: body.avatar,
    address: body.address,
    isActive: body.isActive,
    updatedAt: new Date(),
  };

  // Remove undefined values
  const updateData = Object.fromEntries(
    Object.entries(allowedFields).filter(([_, value]) => value !== undefined)
  );

  const [updated] = await db
    .update(customers)
    .set(updateData)
    .where(eq(customers.id, id))
    .returning({
      id: customers.id,
      name: customers.name,
      email: customers.email,
      phone: customers.phone,
      avatar: customers.avatar,
      address: customers.address,
      isActive: customers.isActive,
      createdAt: customers.createdAt,
      updatedAt: customers.updatedAt,
    });

  return c.json({ success: true, data: updated });
});

// DELETE /api/customers/:id — admin only: delete customer
customersRouter.delete('/:id', authMiddleware, async (c) => {
  const id = parseInt(c.req.param('id'));

  const [existing] = await db.select().from(customers).where(eq(customers.id, id));
  if (!existing) return c.json({ success: false, message: 'Customer not found' }, 404);

  await db.delete(customers).where(eq(customers.id, id));
  return c.json({ success: true, message: 'Customer deleted' });
});

// POST /api/customers/send-email — admin only: send email to customers
customersRouter.post('/send-email', authMiddleware, async (c) => {
  const { customerIds, subject, body } = await c.req.json();

  if (!customerIds || !Array.isArray(customerIds) || customerIds.length === 0) {
    return c.json({ success: false, message: 'Customer IDs are required' }, 400);
  }

  if (!subject || !body) {
    return c.json({ success: false, message: 'Subject and body are required' }, 400);
  }

  // Get customer emails
  const selectedCustomers = await db
    .select({ email: customers.email, name: customers.name })
    .from(customers)
    .where(inArray(customers.id, customerIds));

  // Email functionality not yet configured - return 501 Not Implemented
  return c.json({
    success: false,
    message: 'Email functionality is not yet configured. Please configure a mailer service (nodemailer, SendGrid, etc.) to enable bulk email sending.',
    data: {
      recipients: selectedCustomers.map(c => c.email),
      subject,
    },
  }, 501);
});

export default customersRouter;
