-- Fix RLS policies for order_items table
-- This allows users to insert order items when creating orders

-- Drop existing policy if it exists (to avoid conflicts)
DROP POLICY IF EXISTS "Users can create order items" ON order_items;

-- Create INSERT policy for order_items
-- Users can insert order items if:
-- 1. The order belongs to them (user_id matches), OR
-- 2. The order has no user_id (guest checkout)
CREATE POLICY "Users can create order items" ON order_items
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = order_items.order_id 
    AND (orders.user_id = auth.uid() OR orders.user_id IS NULL)
  )
);

-- Also ensure UPDATE policy exists for order status updates (if needed later)
DROP POLICY IF EXISTS "Users can update their own orders" ON orders;
CREATE POLICY "Users can update their own orders" ON orders
FOR UPDATE
USING (auth.uid() = user_id OR user_id IS NULL)
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

