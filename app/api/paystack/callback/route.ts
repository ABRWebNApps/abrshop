import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const reference = searchParams.get('reference')
  const trxref = searchParams.get('trxref') // Paystack sometimes uses trxref instead

  const paymentRef = reference || trxref

  if (!paymentRef) {
    // No reference means user likely closed popup without payment
    // Try to get order ID from metadata if available
    const orderId = searchParams.get('order_id')
    if (orderId) {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                      request.headers.get('origin') || 
                      'http://localhost:3000'
      return NextResponse.redirect(new URL(`/orders/${orderId}?payment=cancelled`, baseUrl))
    }
    return NextResponse.redirect(new URL('/checkout?error=no_reference', request.url))
  }

  // Get order ID from reference (we use order ID as reference during initialization)
  const supabase = await createClient()
  const { data: order } = await supabase
    .from('orders')
    .select('id')
    .eq('id', paymentRef)
    .single()

  // If no order found by ID, try to find by payment_reference
  let orderId = order?.id
  if (!orderId) {
    const { data: orderByRef } = await supabase
      .from('orders')
      .select('id')
      .eq('payment_reference', paymentRef)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    orderId = orderByRef?.id
  }

  // Redirect to payment verification page
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                  request.headers.get('origin') || 
                  'http://localhost:3000'
  
  if (orderId) {
    // Redirect to order page if payment was cancelled (no reference means cancelled)
    if (!reference && !trxref) {
      return NextResponse.redirect(new URL(`/orders/${orderId}?payment=cancelled`, baseUrl))
    }
  }
  
  return NextResponse.redirect(new URL(`/payment/verify?reference=${paymentRef}`, baseUrl))
}

