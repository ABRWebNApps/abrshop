-- User profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name VARCHAR(255),
  phone VARCHAR(50),
  profile_picture_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User addresses table
CREATE TABLE IF NOT EXISTS user_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  zip VARCHAR(20) NOT NULL,
  country VARCHAR(100) NOT NULL DEFAULT 'Nigeria',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User favourites table
CREATE TABLE IF NOT EXISTS user_favourites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- User payment methods table
CREATE TABLE IF NOT EXISTS user_payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'card', 'bank_account', etc.
  last_four VARCHAR(4),
  brand VARCHAR(50), -- 'visa', 'mastercard', etc.
  expiry_month INTEGER,
  expiry_year INTEGER,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin settings table
CREATE TABLE IF NOT EXISTS admin_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email_notifications BOOLEAN DEFAULT true,
  order_updates BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_user ON user_profiles(id);
CREATE INDEX IF NOT EXISTS idx_user_addresses_user ON user_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favourites_user ON user_favourites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favourites_product ON user_favourites(product_id);
CREATE INDEX IF NOT EXISTS idx_user_payment_methods_user ON user_payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_settings_user ON admin_settings(user_id);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favourites ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view their own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for user_addresses
CREATE POLICY "Users can view their own addresses" ON user_addresses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own addresses" ON user_addresses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own addresses" ON user_addresses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own addresses" ON user_addresses FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for user_favourites
CREATE POLICY "Users can view their own favourites" ON user_favourites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own favourites" ON user_favourites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own favourites" ON user_favourites FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for user_payment_methods
CREATE POLICY "Users can view their own payment methods" ON user_payment_methods FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own payment methods" ON user_payment_methods FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own payment methods" ON user_payment_methods FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own payment methods" ON user_payment_methods FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for admin_settings
CREATE POLICY "Admins can view their own settings" ON admin_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can update their own settings" ON admin_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can insert their own settings" ON admin_settings FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create storage bucket for profile pictures
INSERT INTO storage.buckets (id, name, public) VALUES ('profile-pictures', 'profile-pictures', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for profile pictures
CREATE POLICY "Users can view profile pictures" ON storage.objects FOR SELECT USING (bucket_id = 'profile-pictures');
CREATE POLICY "Users can upload their own profile picture" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'profile-pictures' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
CREATE POLICY "Users can update their own profile picture" ON storage.objects FOR UPDATE USING (
  bucket_id = 'profile-pictures' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
CREATE POLICY "Users can delete their own profile picture" ON storage.objects FOR DELETE USING (
  bucket_id = 'profile-pictures' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

