import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import db from '../db/index.js';
import { shippingZones } from '../db/schema.js';

const shippingRouter = new Hono();

// GET /api/shipping/zones - Get all active shipping zones
shippingRouter.get('/zones', async (c) => {
  try {
    const zones = await db
      .select()
      .from(shippingZones)
      .where(eq(shippingZones.isActive, true))
      .orderBy(shippingZones.state);

    return c.json(zones);
  } catch (error: any) {
    console.error('Error fetching shipping zones:', error);
    return c.json({ error: error.message || 'Failed to fetch shipping zones' }, 500);
  }
});

// POST /api/shipping/calculate - Calculate shipping fee
shippingRouter.post('/calculate', async (c) => {
  try {
    const body = await c.req.json();
    const { state, city, weight = 0 } = body;

    if (!state) {
      return c.json({ error: 'State is required' }, 400);
    }

    // Find matching zone
    const zone = await db
      .select()
      .from(shippingZones)
      .where(eq(shippingZones.state, state))
      .limit(1);

    if (zone.length === 0) {
      return c.json(
        { error: `Shipping to ${state} is not available` },
        400
      );
    }

    const shippingZone = zone[0];

    // Calculate shipping fee
    let shippingFee = parseFloat(shippingZone.baseRate);
    if (weight > 0 && shippingZone.perKgRate) {
      shippingFee += weight * parseFloat(shippingZone.perKgRate);
    }

    return c.json({
      state,
      city: city || shippingZone.state,
      shippingFee: shippingFee.toFixed(2),
      estimatedDays: shippingZone.estimatedDays,
      zone: {
        id: shippingZone.id,
        name: shippingZone.name,
        baseRate: shippingZone.baseRate,
        perKgRate: shippingZone.perKgRate,
        estimatedDays: shippingZone.estimatedDays,
      },
    });
  } catch (error: any) {
    console.error('Error calculating shipping:', error);
    return c.json({ error: error.message || 'Failed to calculate shipping' }, 500);
  }
});

// GET /api/shipping/zones/:id - Get single zone details
shippingRouter.get('/zones/:id', async (c) => {
  try {
    const zoneId = parseInt(c.req.param('id'));

    const zone = await db
      .select()
      .from(shippingZones)
      .where(eq(shippingZones.id, zoneId))
      .limit(1);

    if (zone.length === 0) {
      return c.json({ error: 'Shipping zone not found' }, 404);
    }

    return c.json(zone[0]);
  } catch (error: any) {
    console.error('Error fetching zone:', error);
    return c.json({ error: error.message || 'Failed to fetch zone' }, 500);
  }
});

// POST /api/shipping/zones - Create a new shipping zone (admin only)
shippingRouter.post('/zones', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { name, state, city, region, baseRate, perKgRate, estimatedDays } = body;

    if (!name || !state || !baseRate) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    const newZone = await db
      .insert(shippingZones)
      .values({
        name,
        state,
        city,
        region,
        baseRate: parseFloat(baseRate),
        perKgRate: perKgRate ? parseFloat(perKgRate) : 0,
        estimatedDays: estimatedDays || 3,
        isActive: true,
      })
      .returning();

    return c.json({ success: true, zone: newZone[0] }, 201);
  } catch (error: any) {
    console.error('Error creating zone:', error);
    return c.json({ error: error.message || 'Failed to create zone' }, 500);
  }
});

// PUT /api/shipping/zones/:id - Update a shipping zone (admin only)
shippingRouter.put('/zones/:id', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const zoneId = parseInt(c.req.param('id'));
    const body = await c.req.json();
    const { name, state, city, region, baseRate, perKgRate, estimatedDays, isActive } = body;

    const updated = await db
      .update(shippingZones)
      .set({
        name,
        state,
        city,
        region,
        baseRate: baseRate ? parseFloat(baseRate) : undefined,
        perKgRate: perKgRate ? parseFloat(perKgRate) : undefined,
        estimatedDays,
        isActive,
      })
      .where(eq(shippingZones.id, zoneId))
      .returning();

    if (updated.length === 0) {
      return c.json({ error: 'Zone not found' }, 404);
    }

    return c.json({ success: true, zone: updated[0] });
  } catch (error: any) {
    console.error('Error updating zone:', error);
    return c.json({ error: error.message || 'Failed to update zone' }, 500);
  }
});

// DELETE /api/shipping/zones/:id - Delete a shipping zone (admin only)
shippingRouter.delete('/zones/:id', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const zoneId = parseInt(c.req.param('id'));

    const deleted = await db
      .delete(shippingZones)
      .where(eq(shippingZones.id, zoneId))
      .returning();

    if (deleted.length === 0) {
      return c.json({ error: 'Zone not found' }, 404);
    }

    return c.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting zone:', error);
    return c.json({ error: error.message || 'Failed to delete zone' }, 500);
  }
});

export default shippingRouter;
