-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  images TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Banners table
CREATE TABLE IF NOT EXISTS banners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  subtitle TEXT,
  image_url TEXT NOT NULL,
  button_text VARCHAR(100),
  button_link VARCHAR(255),
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email VARCHAR(255) NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  shipping_address JSONB NOT NULL,
  payment_reference VARCHAR(255),
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_reference ON orders(payment_reference);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_banners_active ON banners(is_active);

-- Enable Row Level Security (RLS)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Policies for public read access
CREATE POLICY "Public read access for categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Public read access for products" ON products FOR SELECT USING (true);
CREATE POLICY "Public read access for banners" ON banners FOR SELECT USING (true);

-- Policies for authenticated users
CREATE POLICY "Users can view their own orders" ON orders FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can create orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own orders" ON orders FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL) WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can view their own order items" ON order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND (orders.user_id = auth.uid() OR orders.user_id IS NULL))
);
CREATE POLICY "Users can create order items" ON order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND (orders.user_id = auth.uid() OR orders.user_id IS NULL))
);

-- Admin policies (requires admin role in user_metadata)
CREATE POLICY "Admin full access to categories" ON categories FOR ALL USING (
  (auth.jwt() ->> 'user_metadata')::jsonb->>'role' = 'admin'
);
CREATE POLICY "Admin full access to products" ON products FOR ALL USING (
  (auth.jwt() ->> 'user_metadata')::jsonb->>'role' = 'admin'
);
CREATE POLICY "Admin full access to banners" ON banners FOR ALL USING (
  (auth.jwt() ->> 'user_metadata')::jsonb->>'role' = 'admin'
);
CREATE POLICY "Admin full access to orders" ON orders FOR ALL USING (
  (auth.jwt() ->> 'user_metadata')::jsonb->>'role' = 'admin'
);
CREATE POLICY "Admin full access to order_items" ON order_items FOR ALL USING (
  (auth.jwt() ->> 'user_metadata')::jsonb->>'role' = 'admin'
);

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) VALUES ('banner-images', 'banner-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Public read access for product images" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "Admin upload access for product images" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'product-images' AND
  (auth.jwt() ->> 'user_metadata')::jsonb->>'role' = 'admin'
);
CREATE POLICY "Admin update access for product images" ON storage.objects FOR UPDATE USING (
  bucket_id = 'product-images' AND
  (auth.jwt() ->> 'user_metadata')::jsonb->>'role' = 'admin'
);
CREATE POLICY "Admin delete access for product images" ON storage.objects FOR DELETE USING (
  bucket_id = 'product-images' AND
  (auth.jwt() ->> 'user_metadata')::jsonb->>'role' = 'admin'
);

CREATE POLICY "Public read access for banner images" ON storage.objects FOR SELECT USING (bucket_id = 'banner-images');
CREATE POLICY "Admin upload access for banner images" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'banner-images' AND
  (auth.jwt() ->> 'user_metadata')::jsonb->>'role' = 'admin'
);
CREATE POLICY "Admin update access for banner images" ON storage.objects FOR UPDATE USING (
  bucket_id = 'banner-images' AND
  (auth.jwt() ->> 'user_metadata')::jsonb->>'role' = 'admin'
);
CREATE POLICY "Admin delete access for banner images" ON storage.objects FOR DELETE USING (
  bucket_id = 'banner-images' AND
  (auth.jwt() ->> 'user_metadata')::jsonb->>'role' = 'admin'
);

