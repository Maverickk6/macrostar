# Migration Notes

## SKU Unique Constraint Migration

### Pre-Migration Steps

Before applying the Drizzle migration that adds `.unique()` to the `products.sku` column, run the following SQL checks to detect and handle existing data issues.

### Step 1: Detect Data Issues

Run these queries to identify existing problems:

```sql
-- 1. Find duplicate SKUs
SELECT sku, COUNT(*) as count 
FROM products 
WHERE sku IS NOT NULL 
GROUP BY sku 
HAVING COUNT(*) > 1;

-- 2. Find NULL SKUs
SELECT COUNT(*) as null_sku_count 
FROM products 
WHERE sku IS NULL;
```

### Step 2: Handle Duplicate SKUs

If duplicates exist, update them to unique generated values:

```sql
-- Update duplicate SKUs by appending a unique suffix
WITH duplicates AS (
  SELECT id, sku, ROW_NUMBER() OVER (PARTITION BY sku ORDER BY id) as row_num
  FROM products
  WHERE sku IS NOT NULL
)
UPDATE products
SET sku = sku || '-' || row_num
WHERE id IN (SELECT id FROM duplicates WHERE row_num > 1);
```

### Step 3: Handle NULL SKUs

If NULL SKUs exist, generate unique values for them:

```sql
-- Generate unique SKUs for NULL values
UPDATE products
SET sku = 'MST-GEN-' || LPAD(id::text, 6, '0')
WHERE sku IS NULL;
```

### Step 4: Verify Data Integrity

After running the cleanup queries, verify the data:

```sql
-- Verify no duplicates
SELECT sku, COUNT(*) as count 
FROM products 
WHERE sku IS NOT NULL 
GROUP BY sku 
HAVING COUNT(*) > 1;

-- Verify no NULLs
SELECT COUNT(*) as null_sku_count 
FROM products 
WHERE sku IS NULL;

-- Verify all SKUs are unique
SELECT COUNT(DISTINCT sku) as unique_sku_count, COUNT(*) as total_count
FROM products
WHERE sku IS NOT NULL;
```

### Step 5: Apply Drizzle Migration

Once the data is clean, run the Drizzle migration to add the unique constraint:

```bash
npm run db:migrate
```

### Important Notes

- **Backup First**: Always backup your database before running migration scripts
- **Test in Staging**: Run these scripts in a staging environment first
- **Monitor Production**: Monitor the production database after migration for any issues
- **Rollback Plan**: Have a rollback plan ready in case of issues

### Migration Order

1. Run pre-migration checks (Step 1)
2. Handle duplicates (Step 2) if needed
3. Handle NULLs (Step 3) if needed
4. Verify data integrity (Step 4)
5. Apply Drizzle migration (Step 5)

### Post-Migration Verification

After the migration is complete, verify that the unique constraint is working:

```sql
-- Try to insert a duplicate SKU (should fail)
INSERT INTO products (name, sku, price, stock) 
VALUES ('Test Product', 'MST-TEST-001', 100.00, 10)
ON CONFLICT (sku) DO NOTHING;
```

### Related Files

- Schema: `src/db/schema.ts` - SKU unique constraint definition
- Migration: `src/db/migrations/` - Drizzle migration files
- API Routes: `src/routes/products.ts` - SKU generation and validation logic
