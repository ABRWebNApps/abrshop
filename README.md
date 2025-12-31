# ABR TECHNOLOGIES LTD - eCommerce Store

A minimalist, high-end eCommerce website built with Next.js 16, Supabase, and Tailwind CSS. Inspired by Apple and Nike's clean design aesthetic with subtle gradient accents.

## Features

### Frontend

- **Minimalist Design**: Clean, premium UI with subtle gradient effects
- **Product Showcase**: High-resolution product images with hover zoom effects
- **Dynamic Filtering**: Real-time product filtering and sorting (no page reloads)
- **Shopping Cart**: Persistent cart with real-time updates
- **Checkout Flow**: Seamless checkout for both guests and authenticated users
- **Responsive Design**: Fully responsive across all devices

### Backend & Admin

- **Full CRUD Operations**: Complete product, category, and banner management
- **Admin Dashboard**: Simple but powerful admin interface
- **Image Management**: Supabase Storage integration for product and banner images
- **Banner Scheduling**: Schedule promotional banners with start/end dates
- **Order Management**: View and manage customer orders
- **Role-Based Access**: Secure admin authentication

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Styling**: Tailwind CSS 4
- **State Management**: Zustand
- **Forms**: React Hook Form + Zod
- **Icons**: Lucide React

## Setup Instructions

### 1. Prerequisites

- Node.js 18+ installed
- A Supabase account and project

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your_supabase_anon_key
```

### 4. Database Setup

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the SQL script from `supabase-schema.sql` to create all necessary tables, policies, and storage buckets
4. (Optional) Run `supabase-dummy-data.sql` to populate the site with sample products, categories, and a banner

### 5. Storage Buckets

The schema will automatically create two storage buckets:

- `product-images` - For product images
- `banner-images` - For banner images

Make sure these buckets are set to **public** in your Supabase dashboard.

### 6. Create Admin User

**Important:** Admin and regular user signup use the **same page** (`/auth/signup`). To make a user an admin, you must manually add the admin role in Supabase.

**Option A: Using Supabase Dashboard (Recommended)**

1. Sign up a new user through the `/auth/signup` page
2. Go to Supabase Dashboard → Authentication → Users
3. Find your user and click "Edit"
4. Under "User Metadata", add:
   ```json
   {
     "role": "admin"
   }
   ```
5. Click "Save"

**Option B: Using SQL Editor**

```sql
UPDATE auth.users
SET raw_user_meta_data = jsonb_build_object('role', 'admin')
WHERE email = 'your-admin-email@example.com';
```

**Note:** Regular users can sign up and shop normally. Only users with `{"role": "admin"}` in their metadata can access the admin dashboard.

### 7. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/
│   ├── admin/              # Admin dashboard pages
│   ├── auth/               # Authentication pages
│   ├── cart/               # Shopping cart page
│   ├── checkout/           # Checkout page
│   ├── orders/             # Order confirmation pages
│   ├── products/           # Product listing and detail pages
│   ├── categories/         # Category listing page
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Homepage
├── components/
│   ├── admin/              # Admin components
│   ├── Header.tsx          # Site header
│   ├── Footer.tsx          # Site footer
│   ├── ProductCard.tsx     # Product card component
│   └── ...
├── lib/
│   └── supabase/           # Supabase client utilities
├── store/
│   └── cart-store.ts       # Zustand cart store
├── types/
│   └── database.ts         # TypeScript types
└── supabase-schema.sql     # Database schema
```

## Key Features Explained

### Product Management

- Create, edit, and delete products
- Upload multiple product images
- Set pricing and stock levels
- Assign products to categories

### Category Management

- Create and manage product categories
- Auto-generate URL-friendly slugs
- Products automatically sorted under categories

### Banner Management

- Upload banner images
- Add text overlays (title, subtitle)
- Configure call-to-action buttons
- Schedule banners with start/end dates
- Toggle active/inactive status

### Order Management

- View all customer orders
- Update order status (pending, processing, shipped, delivered, cancelled)
- View order details and shipping information

## Design Principles

- **Minimalism**: Clean layouts with ample white space
- **Gradient Accents**: Subtle gradients on buttons and key elements
- **Premium Feel**: High-quality imagery and smooth animations
- **User Experience**: Intuitive navigation and seamless interactions
- **Performance**: Optimized images and efficient data fetching

## Security

- Row Level Security (RLS) enabled on all tables
- Admin-only access to CRUD operations
- Public read access for products, categories, and banners
- Users can only view their own orders
- Secure image uploads with admin-only write access

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import your repository in Vercel
3. Add your environment variables
4. Deploy!

### Other Platforms

Make sure to:

- Set all environment variables
- Run database migrations
- Configure storage buckets
- Set up admin user

## Support

For issues or questions, please refer to the Supabase and Next.js documentation.

---

Built with ❤️ for ABR TECHNOLOGIES LTD
