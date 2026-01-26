-- PART A1: Add product_key column to ipf_products (if not exists)
ALTER TABLE public.ipf_products ADD COLUMN IF NOT EXISTS product_key text;

-- Add UNIQUE constraint on product_key (required for ON CONFLICT)
-- Drop the partial index if it exists and create a proper unique constraint
DROP INDEX IF EXISTS idx_ipf_products_product_key;
ALTER TABLE public.ipf_products ADD CONSTRAINT uq_ipf_products_product_key UNIQUE (product_key);