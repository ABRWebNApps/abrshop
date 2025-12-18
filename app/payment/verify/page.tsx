'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { useCartStore } from '@/store/cart-store'

function PaymentVerifyContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const clearCart = useCartStore((state) => state.clearCart)
  const reference = searchParams.get('reference')
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading')
  const [orderId, setOrderId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!reference) {
      setStatus('failed')
      setError('No payment reference provided')
      return
    }

    const verifyPayment = async () => {
      try {
        const response = await fetch(`/api/paystack/verify?reference=${reference}`)
        const data = await response.json()

        if (data.success && data.transaction.status === 'success') {
          // Payment successful
          setStatus('success')
          setOrderId(data.order.id)
          
          // Clear cart after successful payment
          clearCart()
          
          // Redirect immediately to order page with receipt
          router.push(`/orders/${data.order.id}?payment=success`)
        } else {
          // Payment cancelled or failed - still redirect to order page showing pending status
          // The order will remain as "pending" so user can see it and retry
          if (data.order && data.order.id) {
            setOrderId(data.order.id)
            // Redirect to order page showing pending status
            router.push(`/orders/${data.order.id}?payment=cancelled`)
          } else {
            setStatus('failed')
            setError(data.error || 'Payment was cancelled. Your order is still pending.')
          }
        }
      } catch (err: any) {
        setStatus('failed')
        setError(err.message || 'Failed to verify payment')
      }
    }

    verifyPayment()
  }, [reference, router, clearCart])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifying Payment</h2>
            <p className="text-gray-600">Please wait while we verify your payment...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <Loader2 className="w-16 h-16 text-green-500 animate-spin mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
            <p className="text-gray-600 mb-4">Your payment has been verified successfully.</p>
            <p className="text-sm text-gray-500">Redirecting to your order receipt...</p>
          </>
        )}

        {status === 'failed' && orderId ? (
          <>
            <Loader2 className="w-16 h-16 text-yellow-500 animate-spin mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Cancelled</h2>
            <p className="text-gray-600 mb-4">Your order is still pending. You can retry payment later.</p>
            <p className="text-sm text-gray-500">Redirecting to your order...</p>
          </>
        ) : status === 'failed' ? (
          <>
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Verification Failed</h2>
            <p className="text-gray-600 mb-4">{error || 'Your payment could not be verified.'}</p>
            <button
              onClick={() => router.push('/checkout')}
              className="mt-4 w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Return to Checkout
            </button>
          </>
        ) : null}
      </div>
    </div>
  )
}

export default function PaymentVerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
            <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading...</h2>
            <p className="text-gray-600">Please wait...</p>
          </div>
        </div>
      }
    >
      <PaymentVerifyContent />
    </Suspense>
  )
}

