-- PART B: Update RPC to use product_key (slug) for product lookup
-- Also removes success:boolean from return - now returns { order_id, order_number, total_amount } directly
-- Falls back to product_id UUID if product_key not provided (backward compatible)

CREATE OR REPLACE FUNCTION public.ipf_create_order_with_items(payload jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  v_product_key text;
  v_product_id uuid;
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

    -- Extract product_key (slug) or product_id (UUID) - prefer product_key
    v_product_key := v_item->>'product_key';
    v_product_id := NULL;
    
    -- Try to parse product_id as UUID if provided and product_key is not
    IF v_product_key IS NULL OR v_product_key = '' THEN
      BEGIN
        v_product_id := (v_item->>'product_id')::uuid;
      EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'Item % requires product_key or valid product_id', v_item_count;
      END;
    END IF;

    IF (v_item->>'qty') IS NULL OR (v_item->>'qty')::int <= 0 THEN
      RAISE EXCEPTION 'Item % qty must be greater than 0', v_item_count;
    END IF;

    -- Fetch product from DB - prefer product_key lookup, fallback to product_id
    IF v_product_key IS NOT NULL AND v_product_key <> '' THEN
      SELECT id, name, price, is_active, in_stock, todays_available
      INTO v_product
      FROM ipf_products
      WHERE product_key = v_product_key;
    ELSE
      SELECT id, name, price, is_active, in_stock, todays_available
      INTO v_product
      FROM ipf_products
      WHERE id = v_product_id;
    END IF;

    IF v_product IS NULL THEN
      IF v_product_key IS NOT NULL AND v_product_key <> '' THEN
        RAISE EXCEPTION 'Product with key "%" not found', v_product_key;
      ELSE
        RAISE EXCEPTION 'Product % not found', v_product_id;
      END IF;
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

  -- Return order details directly (no success boolean wrapper)
  RETURN jsonb_build_object(
    'order_id', v_order_id,
    'order_number', v_order_number,
    'total_amount', v_total_amount
  );

EXCEPTION WHEN OTHERS THEN
  -- Return error response - keep success:false for error cases only
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$function$;

-- Ensure anon can execute the RPC
GRANT EXECUTE ON FUNCTION public.ipf_create_order_with_items(jsonb) TO anon;