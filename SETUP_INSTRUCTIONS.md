# Setup Instructions for ABR Technologies Store

## Quick Start Guide

### 1. Environment Setup

Create a `.env.local` file with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your_supabase_anon_key
```

### 2. Database Setup

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run `supabase-schema.sql` first to create all tables and policies
4. Then run `supabase-dummy-data.sql` to populate the site with sample products

### 3. Storage Buckets Setup

The schema automatically creates two storage buckets:

- `product-images` - For product images
- `banner-images` - For banner images

Make sure these buckets are set to **Public** in your Supabase dashboard:

1. Go to **Storage** in Supabase dashboard
2. Click on each bucket
3. Ensure "Public bucket" is enabled

### 4. Create Admin User

**Option A: Using Supabase Dashboard (Recommended)**

1. Sign up a new user through `/auth/signup` page
2. Go to Supabase Dashboard → **Authentication** → **Users**
3. Find your user and click **Edit** (or the three dots menu)
4. Under **User Metadata**, add:
   ```json
   {
     "role": "admin"
   }
   ```
5. Click **Save**

**Option B: Using SQL Editor**
Run this SQL in your Supabase SQL Editor (replace with your email):

```sql
UPDATE auth.users
SET raw_user_meta_data = jsonb_build_object('role', 'admin')
WHERE email = 'your-admin-email@example.com';
```

### 5. Admin vs User Signup

**Important:** Admin and regular user signup use the **same page** (`/auth/signup`).

- **Regular Users**: Just sign up normally - they can browse, add to cart, and checkout
- **Admin Users**: Sign up the same way, but you must manually add the `{"role": "admin"}` metadata in Supabase dashboard (see step 4 above)

Once a user has admin role, they will see:

- "Admin" link in the header
- Access to `/admin` dashboard
- Full CRUD capabilities for products, categories, banners, and orders

### 6. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your store!

## What's Included in Dummy Data

The `supabase-dummy-data.sql` file includes:

- **4 Categories**: Laptops, Smartphones, Accessories, Wearables
- **14 Products**: A variety of tech products with descriptions, prices, and stock levels
- **1 Banner**: A welcome banner for the homepage

All products use placeholder images from Unsplash that will work immediately.

## Next Steps

1. **Customize Products**: Go to `/admin` (after setting up admin user) to edit or add products
2. **Upload Real Images**: Use the admin panel to upload your own product images to Supabase Storage
3. **Create More Categories**: Add categories that match your business needs
4. **Customize Banner**: Update the homepage banner with your promotions

## Troubleshooting

**Can't access admin panel?**

- Make sure you've added `{"role": "admin"}` to your user metadata
- Sign out and sign back in
- Check that you're using the correct email

**Products not showing?**

- Make sure you ran both SQL files (schema first, then dummy data)
- Check that products have `stock > 0` (the query filters out out-of-stock items)
- Verify your Supabase connection in `.env.local`

**Images not loading?**

- Ensure storage buckets are set to **Public**
- Check that image URLs are accessible
- Verify `next.config.ts` has the correct image domain settings
