# Contact Form Setup Instructions

## Database Setup

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Run the SQL file: `supabase-contact-messages.sql`
   - This creates the `contact_messages` table with proper RLS policies
   - Users can only see their own messages
   - Admins can see and respond to all messages

## Email Service Configuration

The contact form currently logs emails to the console. To enable actual email sending:

### Option 1: Resend (Recommended)
1. Sign up at [resend.com](https://resend.com)
2. Get your API key
3. Add to `.env.local`:
   ```
   RESEND_API_KEY=your_resend_api_key
   ```
4. Update `app/api/contact/send-email/route.ts` to use Resend

### Option 2: SendGrid
1. Sign up at [sendgrid.com](https://sendgrid.com)
2. Get your API key
3. Add to `.env.local`:
   ```
   SENDGRID_API_KEY=your_sendgrid_api_key
   ```
4. Update the email route to use SendGrid

### Option 3: AWS SES
1. Configure AWS SES
2. Add credentials to `.env.local`
3. Update the email route to use AWS SES

## Features Implemented

✅ Contact form requires authentication
✅ Messages stored in database
✅ Admin panel to view and respond to messages
✅ Email notifications (currently logged, needs email service)
✅ Search box triggers chatbot instead of redirecting
✅ Chat automatically minimizes when product is clicked

## Admin Access

- Navigate to `/superb/admin/access/account/messages`
- View all contact messages
- Mark as read/replied
- Respond to customers directly

