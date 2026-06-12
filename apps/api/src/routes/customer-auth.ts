import { Hono } from 'hono';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { customers } from '../db/schema.js';
import { sendRegistrationConfirmationEmail } from '../services/email.service.js';
import { authRateLimit } from '../middleware/rate-limit.js';

const customerAuth = new Hono();

// POST /api/auth/customer/register
customerAuth.post('/register', authRateLimit, async (c) => {
  try {
    const body = await c.req.json();
    const { name, email, password, confirmPassword, phone, address } = body;

    // Validation
    if (!email || !password || !name) {
      return c.json(
        { success: false, message: 'Name, email, and password required' },
        400
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return c.json(
        { success: false, message: 'Invalid email format' },
        400
      );
    }

    if (password !== confirmPassword) {
      return c.json(
        { success: false, message: 'Passwords do not match' },
        400
      );
    }

    if (password.length < 8) {
      return c.json(
        { success: false, message: 'Password must be at least 8 characters' },
        400
      );
    }

    // Check if customer exists
    const existingCustomer = await db
      .select()
      .from(customers)
      .where(eq(customers.email, email))
      .limit(1);

    if (existingCustomer.length > 0) {
      return c.json(
        { success: false, message: 'Email already registered' },
        409
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create customer
    const newCustomer = await db
      .insert(customers)
      .values({
        name,
        email,
        password: hashedPassword,
        phone: phone || null,
        address: address || null,
      })
      .returning({
        id: customers.id,
        name: customers.name,
        email: customers.email,
        phone: customers.phone,
      });

    if (!newCustomer || newCustomer.length === 0) {
      return c.json(
        { success: false, message: 'Failed to create account' },
        500
      );
    }

    const customer = newCustomer[0];

    // Generate JWT
    const token = jwt.sign(
      { id: customer.id, email: customer.email, type: 'customer' },
      process.env.JWT_SECRET!,
      { expiresIn: '1d' } // 7 days for better user experience
    );

    // Send registration confirmation email (fire and forget)
    sendRegistrationConfirmationEmail(customer.email, customer.name).catch((err) => {
      console.error('Failed to send registration email:', err);
    });

    return c.json(
      {
        success: true,
        data: {
          token,
          customer: {
            id: customer.id,
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
          },
        },
      },
      201
    );
  } catch (error) {
    console.error('Register error:', error);
    return c.json(
      { success: false, message: 'Registration failed' },
      500
    );
  }
});

// POST /api/auth/customer/login
customerAuth.post('/login', async (c) => {
  try {
    const body = await c.req.json();
    const { email, password } = body;

    if (!email || !password) {
      return c.json(
        { success: false, message: 'Email and password required' },
        400
      );
    }

    const customerResult = await db
      .select()
      .from(customers)
      .where(eq(customers.email, email))
      .limit(1);

    if (customerResult.length === 0) {
      return c.json(
        { success: false, message: 'Invalid credentials' },
        401
      );
    }

    const customer = customerResult[0];

    // Check if customer is active
    if (!customer.isActive) {
      return c.json(
        { success: false, message: 'Account is inactive' },
        403
      );
    }

    // Verify password
    const isValid = await bcrypt.compare(password, customer.password);
    if (!isValid) {
      return c.json(
        { success: false, message: 'Invalid credentials' },
        401
      );
    }

    // Update last login
    await db
      .update(customers)
      .set({ lastLoginAt: new Date() })
      .where(eq(customers.id, customer.id));

    // Generate JWT
    const token = jwt.sign(
      { id: customer.id, email: customer.email, type: 'customer' },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' } // 7 days for better user experience
    );

    return c.json({
      success: true,
      data: {
        token,
        customer: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          avatar: customer.avatar,
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json(
      { success: false, message: 'Login failed' },
      500
    );
  }
});

// GET /api/auth/customer/me
customerAuth.get('/me', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json(
        { success: false, message: 'Unauthorized' },
        401
      );
    }

    const token = authHeader.replace('Bearer ', '');

    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
    } catch (err) {
      return c.json(
        { success: false, message: 'Invalid token' },
        401
      );
    }

    if (decoded.type !== 'customer') {
      return c.json(
        { success: false, message: 'Not a customer token' },
        401
      );
    }

    const customerResult = await db
      .select({
        id: customers.id,
        name: customers.name,
        email: customers.email,
        phone: customers.phone,
        avatar: customers.avatar,
        address: customers.address,
        createdAt: customers.createdAt,
      })
      .from(customers)
      .where(eq(customers.id, decoded.id))
      .limit(1);

    if (customerResult.length === 0) {
      return c.json(
        { success: false, message: 'Customer not found' },
        404
      );
    }

    return c.json({
      success: true,
      data: customerResult[0],
    });
  } catch (error) {
    console.error('Get customer error:', error);
    return c.json(
      { success: false, message: 'Failed to get customer data' },
      500
    );
  }
});

// POST /api/auth/customer/logout (for frontend reference - just clear token)
customerAuth.post('/logout', async (c) => {
  return c.json({
    success: true,
    message: 'Logged out successfully',
  });
});

// PUT /api/auth/customer/update-profile
customerAuth.put('/update-profile', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json(
        { success: false, message: 'Unauthorized' },
        401
      );
    }

    const token = authHeader.replace('Bearer ', '');

    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
    } catch (err) {
      return c.json(
        { success: false, message: 'Invalid token' },
        401
      );
    }

    // Ensure token is for a customer, not an admin
    if (decoded.type !== 'customer') {
      return c.json(
        { success: false, message: 'Invalid token' },
        401
      );
    }

    const body = await c.req.json();
    const { name, phone, address, avatar } = body;

    const updated = await db
      .update(customers)
      .set({
        name: name || undefined,
        phone: phone || undefined,
        address: address || undefined,
        avatar: avatar || undefined,
        updatedAt: new Date(),
      })
      .where(eq(customers.id, decoded.id))
      .returning({
        id: customers.id,
        name: customers.name,
        email: customers.email,
        phone: customers.phone,
        avatar: customers.avatar,
        address: customers.address,
      });

    if (updated.length === 0) {
      return c.json(
        { success: false, message: 'Failed to update profile' },
        500
      );
    }

    return c.json({
      success: true,
      data: updated[0],
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return c.json(
      { success: false, message: 'Failed to update profile' },
      500
    );
  }
});

// PUT /api/auth/customer/change-password
customerAuth.put('/change-password', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json(
        { success: false, message: 'Unauthorized' },
        401
      );
    }

    const token = authHeader.replace('Bearer ', '');

    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
    } catch (err) {
      return c.json(
        { success: false, message: 'Invalid token' },
        401
      );
    }

    // Ensure token is for a customer, not an admin
    if (decoded.type !== 'customer') {
      return c.json(
        { success: false, message: 'Invalid token' },
        401
      );
    }

    const body = await c.req.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return c.json(
        { success: false, message: 'Current and new password are required' },
        400
      );
    }

    if (newPassword.length < 8) {
      return c.json(
        { success: false, message: 'New password must be at least 8 characters' },
        400
      );
    }

    const customerResult = await db
      .select()
      .from(customers)
      .where(eq(customers.id, decoded.id))
      .limit(1);

    if (customerResult.length === 0) {
      return c.json(
        { success: false, message: 'Customer not found' },
        404
      );
    }

    const customer = customerResult[0];

    const isValid = await bcrypt.compare(currentPassword, customer.password);
    if (!isValid) {
      return c.json(
        { success: false, message: 'Current password is incorrect' },
        401
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.update(customers)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(customers.id, decoded.id));

    return c.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    return c.json(
      { success: false, message: 'Failed to change password' },
      500
    );
  }
});

export default customerAuth;
