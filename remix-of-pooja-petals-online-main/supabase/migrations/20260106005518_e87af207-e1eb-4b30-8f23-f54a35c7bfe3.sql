
-- Fix search_path for helper functions (security hardening)

CREATE OR REPLACE FUNCTION ipf_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION ipf_next_order_number()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
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
$$;
