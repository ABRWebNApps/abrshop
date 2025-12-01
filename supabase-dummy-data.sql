-- Dummy Categories
INSERT INTO categories (id, name, slug, description) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Laptops', 'laptops', 'High-performance laptops for work and play'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Smartphones', 'smartphones', 'Latest smartphones with cutting-edge technology'),
  ('550e8400-e29b-41d4-a716-446655440003', 'Accessories', 'accessories', 'Essential tech accessories'),
  ('550e8400-e29b-41d4-a716-446655440004', 'Wearables', 'wearables', 'Smart watches and fitness trackers')
ON CONFLICT (id) DO NOTHING;

-- Dummy Products
INSERT INTO products (id, name, description, price, stock, category_id, images) VALUES
  -- Laptops
  ('660e8400-e29b-41d4-a716-446655440001', 'ProBook X1 Ultra', 'Premium business laptop with 16GB RAM, 1TB SSD, and 14-inch 4K display. Perfect for professionals who demand performance and style.', 2499.99, 15, '550e8400-e29b-41d4-a716-446655440001', ARRAY['https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800', 'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=800']),
  
  ('660e8400-e29b-41d4-a716-446655440002', 'Gaming Beast Pro', 'High-performance gaming laptop with RTX 4080, 32GB RAM, and 17-inch 240Hz display. Dominate every game.', 3299.99, 8, '550e8400-e29b-41d4-a716-446655440001', ARRAY['https://images.unsplash.com/photo-1527814050087-3793815479db?w=800', 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800']),
  
  ('660e8400-e29b-41d4-a716-446655440003', 'SlimBook Air', 'Ultra-thin and lightweight laptop with all-day battery life. Perfect for students and professionals on the go.', 1299.99, 22, '550e8400-e29b-41d4-a716-446655440001', ARRAY['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800']),
  
  -- Smartphones
  ('660e8400-e29b-41d4-a716-446655440004', 'TechPhone Pro Max', 'Flagship smartphone with 256GB storage, triple camera system, and 6.7-inch OLED display. The ultimate mobile experience.', 1199.99, 18, '550e8400-e29b-41d4-a716-446655440002', ARRAY['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800']),
  
  ('660e8400-e29b-41d4-a716-446655440005', 'TechPhone Standard', 'Powerful smartphone with 128GB storage, dual camera, and 6.1-inch display. Great value for money.', 699.99, 30, '550e8400-e29b-41d4-a716-446655440002', ARRAY['https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=800']),
  
  ('660e8400-e29b-41d4-a716-446655440006', 'TechPhone Mini', 'Compact smartphone with premium features. Perfect for those who prefer smaller devices.', 599.99, 12, '550e8400-e29b-41d4-a716-446655440002', ARRAY['https://images.unsplash.com/photo-1556656793-08538906a9f8?w=800']),
  
  -- Accessories
  ('660e8400-e29b-41d4-a716-446655440007', 'Wireless Pro Headphones', 'Premium noise-cancelling headphones with 30-hour battery life and crystal-clear audio quality.', 349.99, 25, '550e8400-e29b-41d4-a716-446655440003', ARRAY['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800', 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800']),
  
  ('660e8400-e29b-41d4-a716-446655440008', 'Fast Charge Power Bank', '20,000mAh power bank with 65W fast charging. Charge your devices on the go.', 79.99, 40, '550e8400-e29b-41d4-a716-446655440003', ARRAY['https://images.unsplash.com/photo-1609091839311-d5365f9ff1c8?w=800']),
  
  ('660e8400-e29b-41d4-a716-446655440009', 'USB-C Hub Pro', '7-in-1 USB-C hub with HDMI, USB 3.0, SD card reader, and more. Expand your laptop connectivity.', 89.99, 35, '550e8400-e29b-41d4-a716-446655440003', ARRAY['https://images.unsplash.com/photo-1625842268584-8f3296236761?w=800']),
  
  ('660e8400-e29b-41d4-a716-446655440010', 'Mechanical Keyboard RGB', 'Premium mechanical keyboard with RGB backlighting and customizable keys. Perfect for gaming and typing.', 199.99, 20, '550e8400-e29b-41d4-a716-446655440003', ARRAY['https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=800', 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800']),
  
  ('660e8400-e29b-41d4-a716-446655440011', 'Wireless Mouse Pro', 'Ergonomic wireless mouse with precision tracking and long battery life. Comfortable for all-day use.', 59.99, 45, '550e8400-e29b-41d4-a716-446655440003', ARRAY['https://images.unsplash.com/photo-1527814050087-3793815479db?w=800']),
  
  -- Wearables
  ('660e8400-e29b-41d4-a716-446655440012', 'SmartWatch Pro', 'Advanced smartwatch with health tracking, GPS, and 7-day battery life. Your perfect fitness companion.', 399.99, 28, '550e8400-e29b-41d4-a716-446655440004', ARRAY['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800', 'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=800']),
  
  ('660e8400-e29b-41d4-a716-446655440013', 'Fitness Tracker Elite', 'Lightweight fitness tracker with heart rate monitor, sleep tracking, and 14-day battery. Track your wellness journey.', 149.99, 50, '550e8400-e29b-41d4-a716-446655440004', ARRAY['https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800']),
  
  ('660e8400-e29b-41d4-a716-446655440014', 'Wireless Earbuds Pro', 'True wireless earbuds with active noise cancellation and 24-hour battery with case. Premium audio experience.', 249.99, 33, '550e8400-e29b-41d4-a716-446655440004', ARRAY['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'])
ON CONFLICT (id) DO NOTHING;

-- Dummy Banner
INSERT INTO banners (id, title, subtitle, image_url, button_text, button_link, is_active) VALUES
  ('770e8400-e29b-41d4-a716-446655440001', 'Welcome to ABR Technologies', 'Discover premium technology solutions for modern businesses', 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=1920', 'Shop Now', '/products', true)
ON CONFLICT (id) DO NOTHING;

