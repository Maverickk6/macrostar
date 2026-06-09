import { Hono } from 'hono';
import { eq, and, lte, gte, isNull, or } from 'drizzle-orm';
import db from '../db/index.js';
import { coupons } from '../db/schema.js';

const couponsRouter = new Hono();

// POST /api/coupons/validate - Validate and apply a coupon
couponsRouter.post('/validate', async (c) => {
  try {
    const body = await c.req.json();
    const { code, cartTotal } = body;

    if (!code || !cartTotal) {
      return c.json({ error: 'Missing coupon code or cart total' }, 400);
    }

    // Find coupon
    const coupon = await db
      .select()
      .from(coupons)
      .where(eq(coupons.code, code.toUpperCase()))
      .limit(1);

    if (coupon.length === 0) {
      return c.json({ error: 'Coupon code not found' }, 404);
    }

    const couponData = coupon[0];

    // Check if coupon is active
    if (!couponData.isActive) {
      return c.json({ error: 'This coupon is no longer valid' }, 400);
    }

    // Check expiration
    if (couponData.expiresAt && new Date(couponData.expiresAt) < new Date()) {
      return c.json({ error: 'This coupon has expired' }, 400);
    }

    // Check max uses
    if (couponData.maxUses && couponData.usedCount >= couponData.maxUses) {
      return c.json({ error: 'This coupon has reached its usage limit' }, 400);
    }

    // Check minimum purchase amount
    if (couponData.minPurchaseAmount && parseFloat(cartTotal) < parseFloat(couponData.minPurchaseAmount)) {
      return c.json(
        {
          error: `Minimum purchase amount of ₦${couponData.minPurchaseAmount} required`,
        },
        400
      );
    }

    // Calculate discount
    let discountAmount = 0;
    if (couponData.discountType === 'percentage') {
      discountAmount = (parseFloat(cartTotal) * parseFloat(couponData.discountValue)) / 100;
    } else if (couponData.discountType === 'fixed_amount') {
      discountAmount = parseFloat(couponData.discountValue);
    }

    // Make sure discount doesn't exceed cart total
    discountAmount = Math.min(discountAmount, parseFloat(cartTotal));

    return c.json({
      valid: true,
      coupon: {
        code: couponData.code,
        description: couponData.description,
        discountType: couponData.discountType,
        discountValue: couponData.discountValue,
        discountAmount: discountAmount.toFixed(2),
      },
    });
  } catch (error: any) {
    console.error('Error validating coupon:', error);
    return c.json({ error: error.message || 'Failed to validate coupon' }, 500);
  }
});

// POST /api/coupons/apply - Apply coupon to order (increment used count)
couponsRouter.post('/apply', async (c) => {
  try {
    const body = await c.req.json();
    const { code } = body;

    if (!code) {
      return c.json({ error: 'Missing coupon code' }, 400);
    }

    const coupon = await db
      .select()
      .from(coupons)
      .where(eq(coupons.code, code.toUpperCase()))
      .limit(1);

    if (coupon.length === 0) {
      return c.json({ error: 'Coupon code not found' }, 404);
    }

    // Increment used count
    const updated = await db
      .update(coupons)
      .set({ usedCount: (coupon[0].usedCount || 0) + 1 })
      .where(eq(coupons.id, coupon[0].id))
      .returning();

    return c.json({ success: true, coupon: updated[0] });
  } catch (error: any) {
    console.error('Error applying coupon:', error);
    return c.json({ error: error.message || 'Failed to apply coupon' }, 500);
  }
});

// GET /api/coupons - Get all coupons (admin only)
couponsRouter.get('/', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const allCoupons = await db
      .select()
      .from(coupons)
      .orderBy(coupons.createdAt);

    return c.json(allCoupons);
  } catch (error: any) {
    console.error('Error fetching coupons:', error);
    return c.json({ error: error.message || 'Failed to fetch coupons' }, 500);
  }
});

// POST /api/coupons - Create a new coupon (admin only)
couponsRouter.post('/', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const {
      code,
      description,
      discountType,
      discountValue,
      maxUses,
      minPurchaseAmount,
      applicableCategories,
      applicableProducts,
      expiresAt,
    } = body;

    if (!code || !discountType || !discountValue) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    if (!['percentage', 'fixed_amount'].includes(discountType)) {
      return c.json({ error: 'Invalid discount type' }, 400);
    }

    const newCoupon = await db
      .insert(coupons)
      .values({
        code: code.toUpperCase(),
        description,
        discountType,
        discountValue: parseFloat(discountValue),
        maxUses,
        minPurchaseAmount: minPurchaseAmount ? parseFloat(minPurchaseAmount) : null,
        applicableCategories: applicableCategories || [],
        applicableProducts: applicableProducts || [],
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isActive: true,
      })
      .returning();

    return c.json({ success: true, coupon: newCoupon[0] }, 201);
  } catch (error: any) {
    console.error('Error creating coupon:', error);
    return c.json({ error: error.message || 'Failed to create coupon' }, 500);
  }
});

// PUT /api/coupons/:id - Update a coupon (admin only)
couponsRouter.put('/:id', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const couponId = parseInt(c.req.param('id'));
    const body = await c.req.json();
    const {
      code,
      description,
      discountType,
      discountValue,
      maxUses,
      minPurchaseAmount,
      expiresAt,
      isActive,
    } = body;

    const updated = await db
      .update(coupons)
      .set({
        code: code ? code.toUpperCase() : undefined,
        description,
        discountType,
        discountValue: discountValue ? parseFloat(discountValue) : undefined,
        maxUses,
        minPurchaseAmount: minPurchaseAmount ? parseFloat(minPurchaseAmount) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isActive,
      })
      .where(eq(coupons.id, couponId))
      .returning();

    if (updated.length === 0) {
      return c.json({ error: 'Coupon not found' }, 404);
    }

    return c.json({ success: true, coupon: updated[0] });
  } catch (error: any) {
    console.error('Error updating coupon:', error);
    return c.json({ error: error.message || 'Failed to update coupon' }, 500);
  }
});

// DELETE /api/coupons/:id - Delete a coupon (admin only)
couponsRouter.delete('/:id', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const couponId = parseInt(c.req.param('id'));

    const deleted = await db
      .delete(coupons)
      .where(eq(coupons.id, couponId))
      .returning();

    if (deleted.length === 0) {
      return c.json({ error: 'Coupon not found' }, 404);
    }

    return c.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting coupon:', error);
    return c.json({ error: error.message || 'Failed to delete coupon' }, 500);
  }
});

export default couponsRouter;
