# Simple Contact Form Setup - FIXED

## Quick Fix Steps

### 1. Run the Simple SQL

Go to Supabase Dashboard → SQL Editor and run:

**File: `supabase-contact-messages-simple.sql`**

This creates a simple table with basic RLS policies that only allow users to insert/view their own messages. No complex admin checks in RLS.

### 2. Add Service Role Key (Optional but Recommended)

For admin to view all messages, add to `.env.local`:

```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**To get your service role key:**
1. Go to Supabase Dashboard
2. Settings → API
3. Copy the "service_role" key (NOT the anon key - keep this secret!)

### 3. Test

1. Sign in as a regular user
2. Go to `/contact`
3. Fill out and submit the form
4. It should work now! ✅

### 4. Admin Access

- Admin can view all messages at `/superb/admin/access/account/messages`
- If service role key is set, admin can see all messages
- If not set, admin will only see their own messages (but you can add the key later)

## What Changed

- **Removed** complex admin RLS policies that were causing permission errors
- **Simplified** to basic user-only policies
- **Created** API route `/api/admin/contact-messages` that uses service role client for admin access
- **No more** "permission denied for table users" errors!

## Troubleshooting

If you still get errors:
1. Make sure you ran the SQL file
2. Check that the `contact_messages` table exists in Supabase
3. Verify RLS is enabled on the table
4. Check browser console for specific error messages

