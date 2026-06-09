CREATE TYPE "public"."order_status" AS ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'paid', 'failed', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."product_status" AS ENUM('active', 'inactive', 'out_of_stock');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'superadmin');--> statement-breakpoint
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(120) NOT NULL,
	"description" text,
	"image" text,
	"parent_id" integer,
	"sort_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "coupons" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(50) NOT NULL,
	"description" text,
	"discount_type" varchar(20) NOT NULL,
	"discount_value" numeric(10, 2) NOT NULL,
	"max_uses" integer,
	"used_count" integer DEFAULT 0,
	"min_purchase_amount" numeric(12, 2),
	"applicable_categories" jsonb DEFAULT '[]'::jsonb,
	"applicable_products" jsonb DEFAULT '[]'::jsonb,
	"expires_at" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "coupons_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" text NOT NULL,
	"phone" varchar(20),
	"avatar" text,
	"address" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "customers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "inventory_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"change" integer NOT NULL,
	"previous_stock" integer NOT NULL,
	"new_stock" integer NOT NULL,
	"reason" varchar(255),
	"reference" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"product_id" integer,
	"product_name" varchar(255) NOT NULL,
	"product_image" text,
	"sku" varchar(100),
	"quantity" integer NOT NULL,
	"unit_price" numeric(12, 2) NOT NULL,
	"total" numeric(12, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_number" varchar(20) NOT NULL,
	"customer_id" integer,
	"guest_name" varchar(100),
	"guest_email" varchar(255),
	"guest_phone" varchar(20),
	"status" "order_status" DEFAULT 'pending' NOT NULL,
	"payment_status" "payment_status" DEFAULT 'pending' NOT NULL,
	"payment_ref" varchar(255),
	"payment_method" varchar(50) DEFAULT 'paystack',
	"coupon_code" varchar(50),
	"discount_amount" numeric(12, 2) DEFAULT '0',
	"subtotal" numeric(12, 2) NOT NULL,
	"shipping_fee" numeric(12, 2) DEFAULT '0',
	"total" numeric(12, 2) NOT NULL,
	"shipping_address" jsonb,
	"notes" text,
	"tracking_number" varchar(100),
	"estimated_delivery" timestamp,
	"delivered_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(280) NOT NULL,
	"description" text,
	"short_description" text,
	"price" numeric(12, 2) NOT NULL,
	"compare_price" numeric(12, 2),
	"cost" numeric(12, 2),
	"sku" varchar(100),
	"stock" integer DEFAULT 0 NOT NULL,
	"low_stock_threshold" integer DEFAULT 5,
	"category_id" integer,
	"images" jsonb DEFAULT '[]'::jsonb,
	"specs" jsonb DEFAULT '{}'::jsonb,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"featured" boolean DEFAULT false NOT NULL,
	"status" "product_status" DEFAULT 'active' NOT NULL,
	"weight" numeric(8, 2),
	"brand" varchar(100),
	"warranty" varchar(100),
	"review_count" integer DEFAULT 0,
	"average_rating" numeric(3, 2) DEFAULT '0',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "products_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"customer_id" integer,
	"customer_name" varchar(100) NOT NULL,
	"customer_email" varchar(255),
	"rating" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"verified_purchase" boolean DEFAULT false NOT NULL,
	"helpful_count" integer DEFAULT 0,
	"is_approved" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" varchar(50) NOT NULL,
	"config" jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "settings_type_unique" UNIQUE("type")
);
--> statement-breakpoint
CREATE TABLE "shipping_zones" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"state" varchar(100) NOT NULL,
	"city" varchar(100),
	"region" varchar(100),
	"base_rate" numeric(10, 2) NOT NULL,
	"per_kg_rate" numeric(10, 2) DEFAULT '0',
	"estimated_days" integer DEFAULT 3,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" text NOT NULL,
	"role" "user_role" DEFAULT 'admin' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "inventory_logs" ADD CONSTRAINT "inventory_logs_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;