-- Brands table
CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(name, category_id)
);

-- Add brand_id to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES brands(id) ON DELETE SET NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_brands_category ON brands(category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand_id);

-- Enable Row Level Security
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

-- RLS Policies for brands
CREATE POLICY "Public read access for brands" ON brands FOR SELECT USING (true);
CREATE POLICY "Admin full access to brands" ON brands FOR ALL USING (
  (auth.jwt() ->> 'user_metadata')::jsonb->>'role' = 'admin'
);

