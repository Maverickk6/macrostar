ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_customer_product_unique" UNIQUE ("customer_id", "product_id");
--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_quantity_positive" CHECK ("quantity" > 0);
