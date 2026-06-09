import {
  pgTable,
  serial,
  text,
  varchar,
  integer,
  boolean,
  numeric,
  timestamp,
  jsonb,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ─── Enums ────────────────────────────────────────────────────────────────────
export const productStatusEnum = pgEnum('product_status', ['active', 'inactive', 'out_of_stock']);
export const orderStatusEnum = pgEnum('order_status', ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']);
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'paid', 'failed', 'refunded']);
export const userRoleEnum = pgEnum('user_role', ['admin', 'superadmin']);

// ─── Users (Admin) ────────────────────────────────────────────────────────────
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: text('password').notNull(),
  role: userRoleEnum('role').default('admin').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── Customers (Store Shoppers) ────────────────────────────────────────────────
export const customers = pgTable('customers', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: text('password').notNull(),
  phone: varchar('phone', { length: 20 }),
  avatar: text('avatar'),
  address: jsonb('address').$type<{
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    zip?: string;
  }>(),
  isActive: boolean('is_active').default(true).notNull(),
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── Categories ───────────────────────────────────────────────────────────────
export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 120 }).notNull().unique(),
  description: text('description'),
  image: text('image'),
  parentId: integer('parent_id'),
  sortOrder: integer('sort_order').default(0),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── Products ─────────────────────────────────────────────────────────────────
export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 280 }).notNull().unique(),
  description: text('description'),
  shortDescription: text('short_description'),
  price: numeric('price', { precision: 12, scale: 2 }).notNull(),
  comparePrice: numeric('compare_price', { precision: 12, scale: 2 }),
  cost: numeric('cost', { precision: 12, scale: 2 }),
  sku: varchar('sku', { length: 100 }),
  stock: integer('stock').default(0).notNull(),
  lowStockThreshold: integer('low_stock_threshold').default(5),
  categoryId: integer('category_id').references(() => categories.id),
  images: jsonb('images').$type<string[]>().default([]),
  specs: jsonb('specs').$type<Record<string, string>>().default({}),
  tags: jsonb('tags').$type<string[]>().default([]),
  featured: boolean('featured').default(false).notNull(),
  status: productStatusEnum('status').default('active').notNull(),
  weight: numeric('weight', { precision: 8, scale: 2 }),
  brand: varchar('brand', { length: 100 }),
  warranty: varchar('warranty', { length: 100 }),
  reviewCount: integer('review_count').default(0),
  averageRating: numeric('average_rating', { precision: 3, scale: 2 }).default('0'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── Orders ───────────────────────────────────────────────────────────────────
export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  orderNumber: varchar('order_number', { length: 20 }).notNull().unique(),
  customerId: integer('customer_id').references(() => customers.id, { onDelete: 'set null' }),
  guestName: varchar('guest_name', { length: 100 }),
  guestEmail: varchar('guest_email', { length: 255 }),
  guestPhone: varchar('guest_phone', { length: 20 }),
  status: orderStatusEnum('status').default('pending').notNull(),
  paymentStatus: paymentStatusEnum('payment_status').default('pending').notNull(),
  paymentRef: varchar('payment_ref', { length: 255 }),
  paymentMethod: varchar('payment_method', { length: 50 }).default('paystack'),
  couponCode: varchar('coupon_code', { length: 50 }),
  discountAmount: numeric('discount_amount', { precision: 12, scale: 2 }).default('0'),
  subtotal: numeric('subtotal', { precision: 12, scale: 2 }).notNull(),
  shippingFee: numeric('shipping_fee', { precision: 12, scale: 2 }).default('0'),
  total: numeric('total', { precision: 12, scale: 2 }).notNull(),
  shippingAddress: jsonb('shipping_address').$type<{
    street: string;
    city: string;
    state: string;
    country: string;
    zip?: string;
  }>(),
  notes: text('notes'),
  trackingNumber: varchar('tracking_number', { length: 100 }),
  estimatedDelivery: timestamp('estimated_delivery'),
  deliveredAt: timestamp('delivered_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── Order Items ──────────────────────────────────────────────────────────────
export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(),
  productId: integer('product_id').references(() => products.id),
  productName: varchar('product_name', { length: 255 }).notNull(),
  productImage: text('product_image'),
  sku: varchar('sku', { length: 100 }),
  quantity: integer('quantity').notNull(),
  unitPrice: numeric('unit_price', { precision: 12, scale: 2 }).notNull(),
  total: numeric('total', { precision: 12, scale: 2 }).notNull(),
});

// ─── Inventory Logs ───────────────────────────────────────────────────────────
export const inventoryLogs = pgTable('inventory_logs', {
  id: serial('id').primaryKey(),
  productId: integer('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
  change: integer('change').notNull(), // positive = stock in, negative = stock out
  previousStock: integer('previous_stock').notNull(),
  newStock: integer('new_stock').notNull(),
  reason: varchar('reason', { length: 255 }),
  reference: varchar('reference', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ─── Reviews ──────────────────────────────────────────────────────────────────
export const reviews = pgTable('reviews', {
  id: serial('id').primaryKey(),
  productId: integer('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
  customerId: integer('customer_id').references(() => customers.id, { onDelete: 'set null' }),
  customerName: varchar('customer_name', { length: 100 }).notNull(),
  customerEmail: varchar('customer_email', { length: 255 }),
  rating: integer('rating').notNull(), // 1-5
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  verifiedPurchase: boolean('verified_purchase').default(false).notNull(),
  helpfulCount: integer('helpful_count').default(0),
  isApproved: boolean('is_approved').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── Coupons ──────────────────────────────────────────────────────────────────
export const coupons = pgTable('coupons', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  description: text('description'),
  discountType: varchar('discount_type', { length: 20 }).notNull(), // 'percentage' or 'fixed_amount'
  discountValue: numeric('discount_value', { precision: 10, scale: 2 }).notNull(),
  maxUses: integer('max_uses'),
  usedCount: integer('used_count').default(0),
  minPurchaseAmount: numeric('min_purchase_amount', { precision: 12, scale: 2 }),
  applicableCategories: jsonb('applicable_categories').$type<number[]>().default([]),
  applicableProducts: jsonb('applicable_products').$type<number[]>().default([]),
  expiresAt: timestamp('expires_at'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── Shipping Zones ────────────────────────────────────────────────────────────
export const shippingZones = pgTable('shipping_zones', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  state: varchar('state', { length: 100 }).notNull(),
  city: varchar('city', { length: 100 }),
  region: varchar('region', { length: 100 }),
  baseRate: numeric('base_rate', { precision: 10, scale: 2 }).notNull(),
  perKgRate: numeric('per_kg_rate', { precision: 10, scale: 2 }).default('0'),
  estimatedDays: integer('estimated_days').default(3),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── Settings ──────────────────────────────────────────────────────────────────
export const settings = pgTable('settings', {
  id: serial('id').primaryKey(),
  type: varchar('type', { length: 50 }).notNull().unique(), // 'store', 'payment', 'tax'
  config: jsonb('config').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── Contact Submissions ────────────────────────────────────────────────────────
export const contacts = pgTable('contacts', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  message: text('message').notNull(),
  status: varchar('status', { length: 20 }).default('pending'), // 'pending', 'read', 'replied'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ─── Relations ────────────────────────────────────────────────────────────────
export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, { fields: [categories.parentId], references: [categories.id] }),
  children: many(categories),
  products: many(products),
}));

export const customersRelations = relations(customers, ({ many }) => ({
  orders: many(orders),
  reviews: many(reviews),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
  orderItems: many(orderItems),
  inventoryLogs: many(inventoryLogs),
  reviews: many(reviews),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, { fields: [orders.customerId], references: [customers.id] }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, { fields: [orderItems.productId], references: [products.id] }),
}));

export const inventoryLogsRelations = relations(inventoryLogs, ({ one }) => ({
  product: one(products, { fields: [inventoryLogs.productId], references: [products.id] }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  product: one(products, { fields: [reviews.productId], references: [products.id] }),
  customer: one(customers, { fields: [reviews.customerId], references: [customers.id] }),
}));
