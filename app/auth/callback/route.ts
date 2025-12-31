import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/'
  const redirect = requestUrl.searchParams.get('redirect') ?? '/'
  const type = requestUrl.searchParams.get('type')

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data.user) {
      // Check if this is an email verification
      if (type === 'signup' || type === 'email') {
        // Email verified successfully, redirect to login with redirect URL
        const redirectParam = redirect ? `&redirect=${encodeURIComponent(redirect)}` : ''
        return NextResponse.redirect(new URL(`/auth/login?message=Email verified successfully! You can now sign in.${redirectParam}`, request.url))
      }
      // Regular auth flow - use redirect if available, otherwise use next
      const targetUrl = redirect !== '/' ? redirect : next
      return NextResponse.redirect(new URL(targetUrl, request.url))
    }
    
    if (error) {
      const redirectParam = redirect ? `&redirect=${encodeURIComponent(redirect)}` : ''
      return NextResponse.redirect(new URL(`/auth/login?error=${encodeURIComponent(error.message)}${redirectParam}`, request.url))
    }
  }

  // Return the user to an error page with instructions
  const redirectParam = redirect ? `&redirect=${encodeURIComponent(redirect)}` : ''
  return NextResponse.redirect(new URL(`/auth/login?error=Could not authenticate user${redirectParam}`, request.url))
}

