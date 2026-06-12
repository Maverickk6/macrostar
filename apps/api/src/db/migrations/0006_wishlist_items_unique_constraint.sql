ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_customer_product_unique" UNIQUE ("customer_id", "product_id");
