import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { orders } from '../db/schema.js';

const paymentsRouter = new Hono();

const PAYSTACK_BASE = 'https://api.paystack.co';

// POST /api/payments/initialize — init Paystack transaction
paymentsRouter.post('/initialize', async (c) => {
  const { email, amount, orderId, callbackUrl, metadata } = await c.req.json();

  if (!email || !amount) {
    return c.json({ success: false, message: 'Email and amount are required' }, 400);
  }

  const response = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      amount: Math.round(amount * 100), // Paystack uses kobo
      currency: 'NGN',
      callback_url: callbackUrl,
      metadata: { orderId, ...metadata },
    }),
  });

  const data = await response.json() as any;

  if (!data.status) {
    return c.json({ success: false, message: data.message || 'Payment initialization failed' }, 400);
  }

  return c.json({
    success: true,
    data: {
      authorizationUrl: data.data.authorization_url,
      accessCode: data.data.access_code,
      reference: data.data.reference,
    },
  });
});

// POST /api/payments/verify — verify after redirect
paymentsRouter.post('/verify', async (c) => {
  const { reference, orderId } = await c.req.json();

  if (!reference) {
    return c.json({ success: false, message: 'Payment reference is required' }, 400);
  }

  const response = await fetch(`${PAYSTACK_BASE}/transaction/verify/${reference}`, {
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    },
  });

  const data = await response.json() as any;

  if (!data.status || data.data.status !== 'success') {
    return c.json({ success: false, message: 'Payment verification failed' }, 400);
  }

  // Update order payment status
  if (orderId) {
    await db.update(orders)
      .set({
        paymentStatus: 'paid',
        paymentRef: reference,
        status: 'confirmed',
        updatedAt: new Date(),
      })
      .where(eq(orders.id, parseInt(orderId)));
  }

  return c.json({
    success: true,
    data: {
      reference,
      amount: data.data.amount / 100, // convert from kobo
      currency: data.data.currency,
      channel: data.data.channel,
      paidAt: data.data.paid_at,
    },
  });
});

// POST /api/payments/webhook — Paystack webhook handler
paymentsRouter.post('/webhook', async (c) => {
  const signature = c.req.header('x-paystack-signature');
  const body = await c.req.text();

  // Verify webhook signature
  const crypto = await import('crypto');
  const hash = crypto
    .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY!)
    .update(body)
    .digest('hex');

  if (hash !== signature) {
    return c.json({ success: false, message: 'Invalid signature' }, 400);
  }

  const event = JSON.parse(body);

  if (event.event === 'charge.success') {
    const { reference, metadata } = event.data;
    const orderId = metadata?.orderId;

    if (orderId) {
      await db.update(orders)
        .set({
          paymentStatus: 'paid',
          paymentRef: reference,
          status: 'confirmed',
          updatedAt: new Date(),
        })
        .where(eq(orders.id, parseInt(orderId)));
    }
  }

  return c.json({ received: true });
});

export default paymentsRouter;
