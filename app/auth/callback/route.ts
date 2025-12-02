import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/'
  const type = requestUrl.searchParams.get('type')

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data.user) {
      // Check if this is an email verification
      if (type === 'signup' || type === 'email') {
        // Email verified successfully
        return NextResponse.redirect(new URL('/auth/login?message=Email verified successfully! You can now sign in.', request.url))
      }
      // Regular auth flow
      return NextResponse.redirect(new URL(next, request.url))
    }
    
    if (error) {
      return NextResponse.redirect(new URL(`/auth/login?error=${encodeURIComponent(error.message)}`, request.url))
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(new URL('/auth/login?error=Could not authenticate user', request.url))
}

