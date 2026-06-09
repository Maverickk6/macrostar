import { Hono } from 'hono';
import nodemailer from 'nodemailer';
import { db } from '../db/index.js';
import { contacts } from '../db/schema.js';

const contactRouter = new Hono();

// Email transporter configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// POST /api/contact - Submit contact form
contactRouter.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const { name, email, phone, message } = body;

    // Validate required fields
    if (!name || !email || !message) {
      return c.json(
        { success: false, message: 'Name, email, and message are required' },
        400
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return c.json(
        { success: false, message: 'Invalid email address' },
        400
      );
    }

    // 1. Save to database
    await db.insert(contacts).values({
      name,
      email,
      phone: phone || null,
      message,
      status: 'pending',
      createdAt: new Date(),
    });

    // 2. Send email notification to admin
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@macrostar.ng';
    const adminMailOptions = {
      from: process.env.SMTP_FROM || 'noreply@macrostar.ng',
      to: adminEmail,
      subject: `New Contact Form Submission from ${name}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
        <p><strong>Submitted at:</strong> ${new Date().toLocaleString()}</p>
      `,
    };

    // 3. Send confirmation email to customer
    const customerMailOptions = {
      from: process.env.SMTP_FROM || 'noreply@macrostar.ng',
      to: email,
      subject: 'Thank you for contacting MacroStar Technologies',
      html: `
        <h2>Thank You for Contacting Us</h2>
        <p>Dear ${name},</p>
        <p>We have received your message and our team will get back to you within 3 hours during business days.</p>
        <p><strong>Your Message:</strong></p>
        <p>${message}</p>
        <p>If you have any urgent inquiries, please call us at +234 80 0000 0000.</p>
        <p>Best regards,<br/>MacroStar Technologies Team<br/>Opposite First Bank PLC, Ekpoma, Edo State</p>
      `,
    };

    // Send emails (fire and forget, don't wait for completion)
    Promise.all([
      transporter.sendMail(adminMailOptions).catch((err) => {
        console.error('Failed to send admin email:', err);
      }),
      transporter.sendMail(customerMailOptions).catch((err) => {
        console.error('Failed to send customer email:', err);
      }),
    ]);

    return c.json({
      success: true,
      message: 'Message sent successfully',
    });
  } catch (error: any) {
    console.error('Error processing contact form:', error);
    return c.json(
      { success: false, message: 'Failed to send message' },
      500
    );
  }
});

export default contactRouter;
