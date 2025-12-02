# Email Verification Setup Guide

## Overview
Email verification is now enabled in the code. Users must verify their email address before they can sign in to the platform.

## Supabase Dashboard Configuration

To fully enable email verification, you need to configure it in your Supabase dashboard:

### Step 1: Enable Email Confirmation

1. Go to your **Supabase Dashboard**
2. Navigate to **Authentication** → **Settings** (or **Auth** → **Configuration**)
3. Under **Email Auth**, find the **"Enable email confirmations"** option
4. **Enable** this option
5. Save the changes

### Step 2: Configure Email Templates (Optional)

1. Still in **Authentication** → **Settings**
2. Go to **Email Templates** section
3. Customize the **"Confirm signup"** template if desired
4. The default template includes a verification link that redirects to `/auth/callback`

### Step 3: Set Site URL

1. In **Authentication** → **Settings**
2. Set your **Site URL** to your production domain (e.g., `https://yourdomain.com`)
3. Add your local development URL to **Redirect URLs** if testing locally (e.g., `http://localhost:3000`)

## How It Works

### User Signup Flow:
1. User fills out the signup form
2. User submits the form
3. **User is NOT automatically logged in**
4. User receives a verification email
5. User clicks the verification link in the email
6. User is redirected to `/auth/callback?type=signup`
7. User sees a success message and is redirected to login page
8. User can now sign in with their verified account

### User Login Flow:
- If a user tries to sign in before verifying their email, they will see an error message asking them to verify their email first
- Once verified, users can sign in normally

## Testing Email Verification

### In Development:
1. Sign up with a real email address
2. Check your email inbox (and spam folder)
3. Click the verification link
4. You should be redirected to the login page with a success message
5. Try to sign in - it should work now

### Using Supabase Local Development:
If you're using Supabase locally, emails will be logged in the Supabase logs instead of being sent. Check your terminal for the verification link.

## Troubleshooting

### Users are still auto-logged in after signup:
- Check that "Enable email confirmations" is enabled in Supabase dashboard
- Clear browser cookies and try again
- Check that the code changes have been deployed

### Verification emails not being sent:
- Check your Supabase project's email settings
- Verify SMTP is configured (for production)
- Check spam/junk folders
- For development, check Supabase logs

### Verification link not working:
- Ensure your Site URL and Redirect URLs are correctly configured
- Check that `/auth/callback` route is accessible
- Verify the callback route is handling the verification code correctly

## Code Changes Made

1. **Signup Page** (`app/auth/signup/page.tsx`):
   - Always signs out user after signup (prevents auto-login)
   - Shows verification message
   - Redirects to login page after 3 seconds

2. **Login Page** (`app/auth/login/page.tsx`):
   - Checks if user email is verified before allowing login
   - Shows helpful error messages for unverified accounts
   - Displays verification messages from URL params

3. **Callback Route** (`app/auth/callback/route.ts`):
   - Handles email verification callbacks
   - Shows success message after verification
   - Redirects to login page with confirmation

## Important Notes

- **Existing users**: Users who signed up before this change may need to verify their email on their next login attempt
- **Admin accounts**: Admin accounts also need to verify their email
- **Password reset**: Email verification is separate from password reset functionality

