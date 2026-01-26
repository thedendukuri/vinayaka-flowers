-- Add explicit deny-all RLS policies as defense-in-depth
-- These policies explicitly block all access for anon/authenticated roles
-- The SECURITY DEFINER RPC (ipf_create_order_with_items) bypasses RLS, so order creation still works

-- Deny all SELECT on ipf_orders for anon/authenticated
CREATE POLICY "Deny all access to orders" 
ON public.ipf_orders 
FOR ALL 
TO anon, authenticated
USING (false)
WITH CHECK (false);

-- Deny all SELECT on ipf_order_items for anon/authenticated
CREATE POLICY "Deny all access to order items" 
ON public.ipf_order_items 
FOR ALL 
TO anon, authenticated
USING (false)
WITH CHECK (false);

-- Deny all access on ipf_order_sequence for anon/authenticated
CREATE POLICY "Deny all access to order sequence" 
ON public.ipf_order_sequence 
FOR ALL 
TO anon, authenticated
USING (false)
WITH CHECK (false);