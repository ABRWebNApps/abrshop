'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'

interface VerifyPaymentProps {
  orderId: string
  onVerified: (success: boolean) => void
}

export default function VerifyPayment({ orderId, onVerified }: VerifyPaymentProps) {
  const router = useRouter()
  const [verifying, setVerifying] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Get the order to find payment reference
        let orderResponse: Response
        try {
          orderResponse = await fetch(`/api/orders/${orderId}`)
        } catch (fetchError: any) {
          console.error('Network error fetching order:', fetchError)
          setError('Network error: Unable to verify payment. Please check your connection and try again.')
          setVerifying(false)
          onVerified(false)
          return
        }

        if (!orderResponse.ok) {
          throw new Error('Order not found')
        }

        let order: any
        try {
          order = await orderResponse.json()
        } catch (parseError) {
          console.error('Failed to parse order response:', parseError)
          setError('Failed to load order information. Please try again.')
          setVerifying(false)
          onVerified(false)
          return
        }
        
        if (!order.payment_reference) {
          setError('No payment reference found. Payment may not have been completed.')
          setVerifying(false)
          onVerified(false)
          return
        }

        // Verify payment with Paystack
        let verifyResponse: Response
        try {
          verifyResponse = await fetch(`/api/paystack/verify?reference=${order.payment_reference}`)
        } catch (fetchError: any) {
          console.error('Network error verifying payment:', fetchError)
          setError('Network error: Unable to verify payment. Please check your connection and try again.')
          setVerifying(false)
          onVerified(false)
          return
        }

        let verifyData: any
        try {
          verifyData = await verifyResponse.json()
        } catch (parseError) {
          console.error('Failed to parse verification response:', parseError)
          setError('Failed to verify payment. Please try again.')
          setVerifying(false)
          onVerified(false)
          return
        }

        if (verifyData.success && verifyData.transaction?.status === 'success') {
          // Payment successful - redirect to success page
          router.push(`/orders/${orderId}?payment=success`)
          onVerified(true)
        } else {
          // Payment not found or failed
          setError('Payment verification failed. If you completed payment, it may take a few moments to process.')
          setVerifying(false)
          onVerified(false)
        }
      } catch (err: any) {
        console.error('Payment verification error:', err)
        setError(err.message || 'Failed to verify payment. Please try again.')
        setVerifying(false)
        onVerified(false)
      }
    }

    verifyPayment()
  }, [orderId, router, onVerified])

  if (verifying) {
    return (
      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 flex items-center space-x-3">
        <Loader2 className="w-6 h-6 text-blue-500 animate-spin flex-shrink-0" />
        <div>
          <p className="text-blue-400 font-semibold">Verifying Payment...</p>
          <p className="text-blue-300 text-sm">Please wait while we verify your payment.</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4 flex items-center space-x-3">
        <XCircle className="w-6 h-6 text-yellow-500 flex-shrink-0" />
        <div>
          <p className="text-yellow-400 font-semibold">Verification Failed</p>
          <p className="text-yellow-300 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  return null
}

