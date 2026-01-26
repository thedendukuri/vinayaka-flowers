
-- ============================================
-- PHASE 1: IPF DATABASE FOUNDATION
-- Guest Checkout Order Capture (No UI changes)
-- ============================================

-- 1) TABLES
-- -----------------------------------------

-- A) ipf_products
CREATE TABLE IF NOT EXISTS ipf_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  price numeric(10,2) NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT 'unit',
  is_active boolean NOT NULL DEFAULT true,
  in_stock boolean NOT NULL DEFAULT true,
  todays_available boolean NOT NULL DEFAULT true,
  image_url text NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- B) ipf_orders
CREATE TABLE IF NOT EXISTS ipf_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_email text NOT NULL,
  pickup_date date NOT NULL,
  preferred_time text NOT NULL,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','in_progress','ready','picked_up','cancelled')),
  notes text NULL,
  subtotal numeric(10,2) NOT NULL DEFAULT 0,
  tax numeric(10,2) NOT NULL DEFAULT 0,
  total_amount numeric(10,2) NOT NULL DEFAULT 0,
  payment_method text NOT NULL DEFAULT 'pay_at_pickup' CHECK (payment_method IN ('pay_at_pickup')),
  payment_status text NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid','paid')),
  paid_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- C) ipf_order_items
CREATE TABLE IF NOT EXISTS ipf_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES ipf_orders(id) ON DELETE CASCADE,
  product_id uuid NULL REFERENCES ipf_products(id),
  product_name_snapshot text NOT NULL,
  unit_price_snapshot numeric(10,2) NOT NULL,
  qty int NOT NULL DEFAULT 1 CHECK (qty > 0),
  line_total numeric(10,2) NOT NULL DEFAULT 0
);

-- D) ipf_order_sequence (single row for atomic order numbering)
CREATE TABLE IF NOT EXISTS ipf_order_sequence (
  id int PRIMARY KEY,
  last_value int NOT NULL
);

INSERT INTO ipf_order_sequence(id, last_value)
VALUES (1, 0)
ON CONFLICT (id) DO NOTHING;

-- 2) INDEXES
-- -----------------------------------------
CREATE INDEX IF NOT EXISTS idx_ipf_orders_created_at ON ipf_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ipf_orders_pickup_date ON ipf_orders(pickup_date);
CREATE INDEX IF NOT EXISTS idx_ipf_orders_status ON ipf_orders(status);
CREATE INDEX IF NOT EXISTS idx_ipf_order_items_order_id ON ipf_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_ipf_products_category ON ipf_products(category);
CREATE INDEX IF NOT EXISTS idx_ipf_products_active ON ipf_products(is_active) WHERE is_active = true;

-- 3) TRIGGER FUNCTIONS
-- -----------------------------------------

-- A) updated_at trigger function
CREATE OR REPLACE FUNCTION ipf_set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- B) Attach triggers (drop if exists to ensure idempotency)
DROP TRIGGER IF EXISTS trg_ipf_products_updated_at ON ipf_products;
CREATE TRIGGER trg_ipf_products_updated_at
  BEFORE UPDATE ON ipf_products
  FOR EACH ROW EXECUTE FUNCTION ipf_set_updated_at();

DROP TRIGGER IF EXISTS trg_ipf_orders_updated_at ON ipf_orders;
CREATE TRIGGER trg_ipf_orders_updated_at
  BEFORE UPDATE ON ipf_orders
  FOR EACH ROW EXECUTE FUNCTION ipf_set_updated_at();

-- C) Next order number function (atomic, concurrency-safe)
CREATE OR REPLACE FUNCTION ipf_next_order_number()
RETURNS text AS $$
DECLARE new_val int;
BEGIN
  UPDATE ipf_order_sequence
    SET last_value = last_value + 1
    WHERE id = 1
    RETURNING last_value INTO new_val;

  IF new_val IS NULL THEN
    RAISE EXCEPTION 'Order sequence not initialized';
  END IF;

  RETURN 'IPF-' || lpad(new_val::text, 5, '0');
END;
$$ LANGUAGE plpgsql;

-- 4) SECURITY: REVOKE DEFAULT PRIVILEGES
-- -----------------------------------------
REVOKE ALL ON ipf_orders FROM anon, authenticated;
REVOKE ALL ON ipf_order_items FROM anon, authenticated;
REVOKE ALL ON ipf_order_sequence FROM anon, authenticated;
REVOKE ALL ON ipf_products FROM anon, authenticated;

-- 5) ENABLE RLS
-- -----------------------------------------
ALTER TABLE ipf_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE ipf_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE ipf_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ipf_order_sequence ENABLE ROW LEVEL SECURITY;

-- 6) RLS POLICIES
-- -----------------------------------------

-- A) ipf_products: Public SELECT for active products only
DROP POLICY IF EXISTS "Public can view active products" ON ipf_products;
CREATE POLICY "Public can view active products"
  ON ipf_products
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- B) ipf_orders: NO public access (orders via RPC only)
-- No policies = no access for anon/authenticated

-- C) ipf_order_items: NO public access (items via RPC only)
-- No policies = no access for anon/authenticated

-- D) ipf_order_sequence: NO public access
-- No policies = no access for anon/authenticated

-- 7) SECURE GUEST ORDER CREATION RPC
-- -----------------------------------------
CREATE OR REPLACE FUNCTION ipf_create_order_with_items(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_customer_name text;
  v_customer_phone text;
  v_customer_email text;
  v_pickup_date date;
  v_preferred_time text;
  v_notes text;
  v_items jsonb;
  v_item jsonb;
  v_product record;
  v_order_id uuid;
  v_order_number text;
  v_subtotal numeric(10,2) := 0;
  v_tax numeric(10,2) := 0;
  v_total_amount numeric(10,2);
  v_line_total numeric(10,2);
  v_item_count int := 0;
BEGIN
  -- Extract and validate customer_name
  v_customer_name := trim(payload->>'customer_name');
  IF v_customer_name IS NULL OR length(v_customer_name) < 2 THEN
    RAISE EXCEPTION 'customer_name must be at least 2 characters';
  END IF;

  -- Extract and validate customer_phone (normalize to digits only, must be 10)
  v_customer_phone := regexp_replace(coalesce(payload->>'customer_phone', ''), '[^0-9]', '', 'g');
  IF length(v_customer_phone) <> 10 THEN
    RAISE EXCEPTION 'customer_phone must be exactly 10 digits';
  END IF;

  -- Extract and validate customer_email
  v_customer_email := lower(trim(payload->>'customer_email'));
  IF v_customer_email IS NULL OR v_customer_email !~ '@' OR v_customer_email !~ '\.' THEN
    RAISE EXCEPTION 'customer_email must be a valid email address';
  END IF;

  -- Extract and validate pickup_date
  BEGIN
    v_pickup_date := (payload->>'pickup_date')::date;
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'pickup_date must be a valid date';
  END;
  IF v_pickup_date < current_date THEN
    RAISE EXCEPTION 'pickup_date cannot be in the past';
  END IF;

  -- Extract and validate preferred_time
  v_preferred_time := trim(payload->>'preferred_time');
  IF v_preferred_time IS NULL OR v_preferred_time = '' THEN
    RAISE EXCEPTION 'preferred_time is required';
  END IF;

  -- Extract optional notes
  v_notes := trim(payload->>'notes');

  -- Extract and validate items array
  v_items := payload->'items';
  IF v_items IS NULL OR jsonb_typeof(v_items) <> 'array' OR jsonb_array_length(v_items) = 0 THEN
    RAISE EXCEPTION 'items must be a non-empty array';
  END IF;

  -- Generate order number atomically
  v_order_number := ipf_next_order_number();

  -- Create the order
  INSERT INTO ipf_orders (
    order_number,
    customer_name,
    customer_phone,
    customer_email,
    pickup_date,
    preferred_time,
    notes,
    status,
    payment_method,
    payment_status
  ) VALUES (
    v_order_number,
    v_customer_name,
    v_customer_phone,
    v_customer_email,
    v_pickup_date,
    v_preferred_time,
    v_notes,
    'new',
    'pay_at_pickup',
    'unpaid'
  ) RETURNING id INTO v_order_id;

  -- Process each item
  FOR v_item IN SELECT * FROM jsonb_array_elements(v_items)
  LOOP
    v_item_count := v_item_count + 1;

    -- Validate item structure
    IF (v_item->>'product_id') IS NULL THEN
      RAISE EXCEPTION 'Item % missing product_id', v_item_count;
    END IF;

    IF (v_item->>'qty') IS NULL OR (v_item->>'qty')::int <= 0 THEN
      RAISE EXCEPTION 'Item % qty must be greater than 0', v_item_count;
    END IF;

    -- Fetch product from DB (server-side pricing)
    SELECT id, name, price, is_active, in_stock, todays_available
    INTO v_product
    FROM ipf_products
    WHERE id = (v_item->>'product_id')::uuid;

    IF v_product IS NULL THEN
      RAISE EXCEPTION 'Product % not found', v_item->>'product_id';
    END IF;

    IF NOT v_product.is_active THEN
      RAISE EXCEPTION 'Product % is not available', v_product.name;
    END IF;

    IF NOT v_product.in_stock THEN
      RAISE EXCEPTION 'Product % is out of stock', v_product.name;
    END IF;

    IF NOT v_product.todays_available THEN
      RAISE EXCEPTION 'Product % is not available today', v_product.name;
    END IF;

    -- Calculate line total from server-side price
    v_line_total := v_product.price * (v_item->>'qty')::int;
    v_subtotal := v_subtotal + v_line_total;

    -- Insert order item with snapshots
    INSERT INTO ipf_order_items (
      order_id,
      product_id,
      product_name_snapshot,
      unit_price_snapshot,
      qty,
      line_total
    ) VALUES (
      v_order_id,
      v_product.id,
      v_product.name,
      v_product.price,
      (v_item->>'qty')::int,
      v_line_total
    );
  END LOOP;

  -- Calculate totals
  v_total_amount := v_subtotal + v_tax;

  -- Update order with totals
  UPDATE ipf_orders
  SET subtotal = v_subtotal,
      tax = v_tax,
      total_amount = v_total_amount
  WHERE id = v_order_id;

  -- Return success response
  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'order_number', v_order_number,
    'total_amount', v_total_amount
  );

EXCEPTION WHEN OTHERS THEN
  -- Return error response
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

-- Grant execute permission on RPC to anon and authenticated
GRANT EXECUTE ON FUNCTION ipf_create_order_with_items(jsonb) TO anon, authenticated;

-- Grant SELECT on ipf_products for RLS policy to work
GRANT SELECT ON ipf_products TO anon, authenticated;
