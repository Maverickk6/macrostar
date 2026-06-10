import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { db } from '../db/index.js';
import { settings as settingsTable } from '../db/schema.js';
import { eq } from 'drizzle-orm';

const settingsRouter = new Hono();

// Apply auth middleware to all settings routes
settingsRouter.use('*', authMiddleware);

// GET /api/settings - Get all settings
settingsRouter.get('/', async (c) => {
  try {
    let allSettings = [];
    try {
      allSettings = await db.select().from(settingsTable);
    } catch (err: any) {
      // Only handle "table does not exist" error as non-fatal
      const errorMessage = err?.message || '';
      if (errorMessage.includes('does not exist') || errorMessage.includes('relation')) {
        console.log('Settings table might not exist, using defaults');
      } else {
        // Rethrow unexpected DB errors
        console.error('Error reading settings from database:', err);
        return c.json(
          { success: false, message: 'Failed to read settings: ' + (err?.message || 'Database error') },
          500
        );
      }
    }

    const settingsMap = {
      store: allSettings.find(s => s.type === 'store')?.config || {
        name: 'MacroStar Technologies',
        email: 'info@macrostar.ng',
        phone: '+234 80 0000 0000',
        address: {
          street: 'Opposite First Bank PLC',
          city: 'Ekpoma',
          state: 'Edo',
          country: 'Nigeria',
          zip: '310001',
        },
      },
      payment: allSettings.find(s => s.type === 'payment')?.config || {
        paystackPublicKey: process.env.PAYSTACK_PUBLIC_KEY || '',
        currency: 'NGN',
      },
      tax: allSettings.find(s => s.type === 'tax')?.config || {
        enabled: false,
        rate: 0,
        taxId: '',
      },
    };

    return c.json({
      success: true,
      data: settingsMap,
    });
  } catch (error: any) {
    console.error('Error fetching settings:', error);
    return c.json(
      { success: false, message: 'Failed to fetch settings: ' + (error?.message || 'Server error') },
      500
    );
  }
});

// PUT /api/settings - Update settings
settingsRouter.put('/', async (c) => {
  try {
    const body = await c.req.json();
    const { type, settings: config } = body;

    if (!type || !config) {
      return c.json(
        { success: false, message: 'Type and config are required' },
        400
      );
    }

    try {
      // Check if settings of this type already exist
      const existing = await db
        .select()
        .from(settingsTable)
        .where(eq(settingsTable.type, type))
        .limit(1);

      if (existing.length > 0) {
        // Update existing settings
        await db
          .update(settingsTable)
          .set({ config, updatedAt: new Date() })
          .where(eq(settingsTable.type, type));
      } else {
        // Insert new settings
        await db.insert(settingsTable).values({
          type,
          config,
          updatedAt: new Date(),
        });
      }
    } catch (err: any) {
      // Only handle "table does not exist" error as non-fatal
      const errorMessage = err?.message || '';
      if (errorMessage.includes('does not exist') || errorMessage.includes('relation')) {
        console.error('Settings table does not exist, cannot persist settings:', err);
        return c.json(
          { success: false, message: 'Settings table does not exist. Please run database migrations.' },
          500
        );
      } else {
        // Rethrow unexpected DB errors
        console.error('Error updating settings in database:', err);
        return c.json(
          { success: false, message: 'Failed to update settings: ' + (err?.message || 'Database error') },
          500
        );
      }
    }

    return c.json({
      success: true,
      message: 'Settings updated successfully',
      data: config,
    });
  } catch (error: any) {
    console.error('Error updating settings:', error);
    return c.json(
      { success: false, message: 'Failed to update settings' },
      500
    );
  }
});

export default settingsRouter;
