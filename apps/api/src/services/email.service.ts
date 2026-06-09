/**
 * Email Service Configuration
 * 
 * Supports two providers:
 * 1. Resend (recommended for Next.js) - requires API key
 * 2. Nodemailer (self-hosted SMTP) - requires SMTP credentials
 * 
 * Environment variables needed:
 * - EMAIL_PROVIDER: 'resend' or 'nodemailer'
 * - RESEND_API_KEY: Your Resend API key
 * - SMTP_HOST: SMTP server host
 * - SMTP_PORT: SMTP server port
 * - SMTP_USER: SMTP username/email
 * - SMTP_PASSWORD: SMTP password
 * - SMTP_FROM_EMAIL: Sender email address
 * - SMTP_FROM_NAME: Sender name
 */

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Resend provider
async function sendWithResend(options: EmailOptions): Promise<boolean> {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error('RESEND_API_KEY not configured');
      return false;
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: `${process.env.SMTP_FROM_NAME || 'MacroStar'} <${process.env.SMTP_FROM_EMAIL || 'noreply@macrostar.ng'}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
      }),
    });

    if (!response.ok) {
      console.error('Resend error:', await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending email with Resend:', error);
    return false;
  }
}

// Nodemailer provider
async function sendWithNodemailer(options: EmailOptions): Promise<boolean> {
  try {
    // Dynamic import to avoid requiring nodemailer if using Resend
    const nodemailer = await import('nodemailer');

    const transporter = nodemailer.default.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `${process.env.SMTP_FROM_NAME || 'MacroStar'} <${process.env.SMTP_FROM_EMAIL || 'noreply@macrostar.ng'}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    return true;
  } catch (error) {
    console.error('Error sending email with Nodemailer:', error);
    return false;
  }
}

/**
 * Send email using configured provider
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const provider = process.env.EMAIL_PROVIDER || 'resend';

  if (provider === 'resend') {
    return sendWithResend(options);
  } else if (provider === 'nodemailer') {
    return sendWithNodemailer(options);
  } else {
    console.error(`Unknown email provider: ${provider}`);
    return false;
  }
}

/**
 * Send order confirmation email
 */
export async function sendOrderConfirmationEmail(
  email: string,
  orderNumber: string,
  items: Array<{ name: string; quantity: number; price: string }>,
  total: string
): Promise<boolean> {
  const itemsHtml = items
    .map(
      (item) =>
        `<tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">x${item.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₦${item.price}</td>
        </tr>`
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border: 1px solid #eee; }
          .order-number { font-size: 18px; font-weight: bold; margin: 10px 0; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .total { text-align: right; font-size: 18px; font-weight: bold; margin-top: 20px; padding-top: 20px; border-top: 2px solid #667eea; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
          .button { display: inline-block; background: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Order Confirmation</h1>
          </div>
          <div class="content">
            <p>Thank you for your order!</p>
            <div class="order-number">Order #${orderNumber}</div>
            <table>
              <thead>
                <tr style="background: #f0f0f0;">
                  <th style="padding: 10px; text-align: left;">Product</th>
                  <th style="padding: 10px; text-align: right;">Qty</th>
                  <th style="padding: 10px; text-align: right;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
            <div class="total">Total: ₦${total}</div>
            <p>You will receive a shipping confirmation email once your order is dispatched.</p>
            <a href="${process.env.STORE_URL || 'http://localhost:3000'}/orders/${orderNumber}" class="button">Track Order</a>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} MacroStar Technologies. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `Order Confirmation - #${orderNumber}`,
    html,
  });
}

/**
 * Send order shipped email
 */
export async function sendOrderShippedEmail(
  email: string,
  orderNumber: string,
  trackingNumber?: string
): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border: 1px solid #eee; }
          .tracking-box { background: white; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; }
          .tracking-label { font-size: 12px; color: #666; text-transform: uppercase; }
          .tracking-number { font-size: 18px; font-weight: bold; font-family: monospace; }
          .button { display: inline-block; background: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Your Order Has Shipped!</h1>
          </div>
          <div class="content">
            <p>Good news! Your order <strong>#${orderNumber}</strong> has been shipped and is on its way to you.</p>
            ${trackingNumber ? `
              <div class="tracking-box">
                <div class="tracking-label">Tracking Number</div>
                <div class="tracking-number">${trackingNumber}</div>
              </div>
            ` : ''}
            <p>You can track your shipment using the tracking number above on the courier's website.</p>
            <a href="${process.env.STORE_URL || 'http://localhost:3000'}/orders/${orderNumber}" class="button">Track Your Order</a>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} MacroStar Technologies. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `Your order #${orderNumber} has shipped!`,
    html,
  });
}

/**
 * Send registration confirmation email
 */
export async function sendRegistrationConfirmationEmail(
  email: string,
  name: string
): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border: 1px solid #eee; }
          .button { display: inline-block; background: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to MacroStar!</h1>
          </div>
          <div class="content">
            <p>Welcome, <strong>${name}</strong>!</p>
            <p>Thank you for creating an account with MacroStar Technologies. Your account has been successfully created and you can now start shopping.</p>
            <p>Browse our wide selection of computer parts and electronics at the best prices.</p>
            <a href="${process.env.STORE_URL || 'http://localhost:3000'}/products" class="button">Start Shopping</a>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} MacroStar Technologies. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: 'Welcome to MacroStar Technologies!',
    html,
  });
}

export default {
  sendEmail,
  sendOrderConfirmationEmail,
  sendOrderShippedEmail,
  sendRegistrationConfirmationEmail,
};
