-- Add explicit deny policies for write operations on ipf_products
-- This prevents any potential RLS bypass or privilege escalation attacks

-- Deny all INSERT operations for anon/authenticated users
CREATE POLICY "Deny product creation"
  ON public.ipf_products FOR INSERT
  TO anon, authenticated
  WITH CHECK (false);

-- Deny all UPDATE operations for anon/authenticated users
CREATE POLICY "Deny product updates"
  ON public.ipf_products FOR UPDATE
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

-- Deny all DELETE operations for anon/authenticated users
CREATE POLICY "Deny product deletion"
  ON public.ipf_products FOR DELETE
  TO anon, authenticated
  USING (false);