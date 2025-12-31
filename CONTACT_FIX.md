# Fix for Contact Form Permission Error

## Problem
The error "permission denied for table users" occurs because the RLS policies try to access `auth.users` directly, which requires special permissions.

## Solution

Run this updated SQL in your Supabase SQL Editor. It uses JWT claims instead of querying the users table directly.

## Steps

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. **First, drop the existing policies and function** (if they exist):
   ```sql
   DROP POLICY IF EXISTS "Admins can view all messages" ON contact_messages;
   DROP POLICY IF EXISTS "Admins can update all messages" ON contact_messages;
   DROP FUNCTION IF EXISTS is_admin();
   ```

4. **Then run the updated SQL** from `supabase-contact-messages.sql`

The key change is that the `is_admin()` function now uses `auth.jwt()` to check the role from JWT claims instead of querying the `auth.users` table directly.

## Alternative: If JWT approach doesn't work

If the JWT approach still has issues, you can use this simpler version that doesn't check admin status in RLS (admin checks will be done in application code):

```sql
-- Drop existing admin policies
DROP POLICY IF EXISTS "Admins can view all messages" ON contact_messages;
DROP POLICY IF EXISTS "Admins can update all messages" ON contact_messages;
DROP FUNCTION IF EXISTS is_admin();

-- Allow service role to bypass RLS (for admin operations)
-- This is handled by using the service role key in admin API routes
```

Then update the admin messages page to use the service role client for admin operations.

