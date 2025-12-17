import { NextRequest, NextResponse } from 'next/server'
import { redirect } from 'next/navigation'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const reference = searchParams.get('reference')

  if (!reference) {
    return NextResponse.redirect(new URL('/checkout?error=no_reference', request.url))
  }

  // Redirect to payment verification page
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                  request.headers.get('origin') || 
                  'http://localhost:3000'
  
  return NextResponse.redirect(new URL(`/payment/verify?reference=${reference}`, baseUrl))
}

