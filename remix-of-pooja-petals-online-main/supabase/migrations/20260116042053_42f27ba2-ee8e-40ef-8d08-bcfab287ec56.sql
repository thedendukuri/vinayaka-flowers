-- Drop the existing status check constraint and add updated one that includes 'pending_confirmation'
ALTER TABLE public.ipf_orders DROP CONSTRAINT IF EXISTS ipf_orders_status_check;

ALTER TABLE public.ipf_orders ADD CONSTRAINT ipf_orders_status_check 
  CHECK (status IN ('new', 'confirmed', 'ready', 'completed', 'cancelled', 'pending_confirmation'));