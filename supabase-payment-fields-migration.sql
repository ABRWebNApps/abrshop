-- Add payment tracking fields to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(255),
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;

-- Create index for payment reference lookups
CREATE INDEX IF NOT EXISTS idx_orders_payment_reference ON orders(payment_reference);

