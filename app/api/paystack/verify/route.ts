import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const reference = searchParams.get('reference')

    if (!reference) {
      return NextResponse.json(
        { error: 'Reference is required' },
        { status: 400 }
      )
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY
    if (!secretKey) {
      return NextResponse.json(
        { error: 'Paystack secret key not configured' },
        { status: 500 }
      )
    }

    // Verify transaction with Paystack
    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
      }
    )

    const data = await response.json()

    if (!response.ok || !data.status) {
      console.error('Paystack verification error:', data)
      return NextResponse.json(
        { error: data.message || 'Failed to verify payment' },
        { status: response.status || 500 }
      )
    }

    const transaction = data.data

    // Verify amount matches (convert from kobo to naira)
    const amountPaid = transaction.amount / 100

    // Get order ID from metadata (we stored it during initialization)
    const orderId = transaction.metadata?.order_id || reference

    // Get order from database
    const supabase = await createClient()
    
    // Try to find order by ID first
    let { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    // If not found by ID, try to find by payment_reference (fallback)
    if (orderError || !order) {
      const { data: orderByRef, error: refError } = await supabase
        .from('orders')
        .select('*')
        .eq('payment_reference', reference)
        .single()
      
      if (orderByRef) {
        order = orderByRef
        orderError = null
      }
    }

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Verify amount matches
    if (Math.abs(amountPaid - order.total) > 0.01) {
      return NextResponse.json(
        { error: 'Amount mismatch' },
        { status: 400 }
      )
    }

      // Update order status based on payment status
      if (transaction.status === 'success') {
        // Update order status to processing and store payment info
        await supabase
          .from('orders')
          .update({
            status: 'processing',
            payment_reference: transaction.reference,
            paid_at: transaction.paid_at ? new Date(transaction.paid_at).toISOString() : null,
          })
          .eq('id', order.id)

        // Update product stock (only if not already done)
        if (order.status === 'pending') {
          const { data: orderItems } = await supabase
            .from('order_items')
            .select('product_id, quantity')
            .eq('order_id', order.id)

          if (orderItems) {
            for (const item of orderItems) {
              // Get current product stock
              const { data: product } = await supabase
                .from('products')
                .select('stock')
                .eq('id', item.product_id)
                .single()

              if (product) {
                // Decrement stock
                await supabase
                  .from('products')
                  .update({ stock: Math.max(0, product.stock - item.quantity) })
                  .eq('id', item.product_id)
              }
            }
          }
        }
      } else {
        // For cancelled/failed payments, keep order as pending so user can see it
        // This allows them to retry payment later
        await supabase
          .from('orders')
          .update({
            status: 'pending',
            payment_reference: transaction.reference,
          })
          .eq('id', order.id)
      }

    return NextResponse.json({
      success: transaction.status === 'success',
      transaction: {
        reference: transaction.reference,
        status: transaction.status,
        amount: amountPaid,
        paid_at: transaction.paid_at,
      },
      order: {
        id: order.id,
        status: transaction.status === 'success' ? 'processing' : order.status,
      },
    })
  } catch (error: any) {
    console.error('Error verifying Paystack payment:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

