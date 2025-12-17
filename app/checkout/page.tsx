'use client'

import { useCartStore } from '@/store/cart-store'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Image from 'next/image'
import { formatCurrency } from '@/lib/utils/currency'

const checkoutSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  zip: z.string().min(5, 'ZIP code is required'),
  country: z.string().min(2, 'Country is required'),
})

type CheckoutFormData = z.infer<typeof checkoutSchema>

export default function CheckoutPage() {
  const items = useCartStore((state) => state.items)
  const getTotal = useCartStore((state) => state.getTotal)
  const clearCart = useCartStore((state) => state.clearCart)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
  })

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data, error } = await supabase.auth.getUser()
      
      if (error || !data.user) {
        // User is not authenticated, redirect to signup with return URL
        router.push(`/auth/signup?redirect=/checkout`)
        return
      }

      // User is authenticated
      setUser(data.user)
      setValue('email', data.user.email || '')
      setCheckingAuth(false)
    }

    checkAuth()
  }, [setValue, router])

  useEffect(() => {
    if (items.length === 0 && !checkingAuth) {
      router.push('/cart')
    }
  }, [items, router, checkingAuth])

  const onSubmit = async (data: CheckoutFormData) => {
    setLoading(true)
    const supabase = createClient()

    try {
      // Create order first (status: pending, will be updated after payment)
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user?.id || null,
          email: data.email,
          total: getTotal(),
          status: 'pending',
          shipping_address: {
            name: data.name,
            address: data.address,
            city: data.city,
            state: data.state,
            zip: data.zip,
            country: data.country,
          },
        })
        .select()
        .single()

      if (orderError) {
        console.error('Order creation error:', orderError)
        throw new Error(orderError.message || `Failed to create order: ${orderError.code || 'Unknown error'}`)
      }

      if (!order) {
        throw new Error('Order was not created successfully')
      }

      // Create order items
      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: item.product.id,
        quantity: item.quantity,
        price: item.product.price,
      }))

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems)

      if (itemsError) {
        console.error('Order items creation error:', itemsError)
        throw new Error(itemsError.message || `Failed to create order items: ${itemsError.code || 'Unknown error'}`)
      }

      // Initialize Paystack payment
      console.log('Initializing Paystack payment for order:', order.id)
      
      const response = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          amount: getTotal(),
          orderId: order.id,
          metadata: [
            {
              display_name: 'Customer Name',
              variable_name: 'customer_name',
              value: data.name,
            },
          ],
        }),
      })

      console.log('Paystack initialize response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Paystack initialization error response:', errorData)
        throw new Error(errorData.error || `Payment initialization failed: ${response.status} ${response.statusText}`)
      }

      const paymentData = await response.json()
      console.log('Paystack payment data received:', { 
        hasAccessCode: !!paymentData.access_code,
        hasReference: !!paymentData.reference,
        hasAuthUrl: !!paymentData.authorization_url
      })

      if (!paymentData.access_code) {
        console.error('Payment data missing access_code:', paymentData)
        throw new Error(paymentData.error || 'Failed to initialize payment - no access code received')
      }

      // Use Paystack Popup to complete payment
      console.log('Opening Paystack popup with access_code:', paymentData.access_code)
      
      try {
        // Dynamically import PaystackPop only on client side
        const PaystackPop = (await import('@paystack/inline-js')).default
        const paystack = new PaystackPop()
        paystack.resumeTransaction(paymentData.access_code)
        
        console.log('Paystack popup opened successfully')
        
        // Don't set loading to false here - let the popup handle the flow
        // The callback will handle redirecting after payment
        // The popup will redirect to callback_url after payment
      } catch (popupError: any) {
        console.error('Paystack popup error:', popupError)
        throw new Error(popupError.message || 'Failed to open payment popup. Please try again.')
      }

      // Note: Cart will be cleared and stock updated after payment verification
      // This happens in the verify endpoint
    } catch (error: any) {
      console.error('Checkout error:', error)
      
      // Extract error message from various error types
      let errorMessage = 'There was an error processing your order. Please try again.'
      
      if (error?.message) {
        errorMessage = error.message
      } else if (typeof error === 'string') {
        errorMessage = error
      } else if (error?.error) {
        errorMessage = error.error
      } else if (error?.code) {
        errorMessage = `Error: ${error.code} - ${error.message || 'Unknown error'}`
      }
      
      alert(errorMessage)
      setLoading(false)
    }
  }

  // Show loading state while checking authentication
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Shipping Information</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  {...register('email')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white placeholder:text-gray-400"
                />
                {errors.email && (
                  <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  {...register('name')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white placeholder:text-gray-400"
                />
                {errors.name && (
                  <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <input
                  type="text"
                  {...register('address')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white placeholder:text-gray-400"
                />
                {errors.address && (
                  <p className="text-red-600 text-sm mt-1">{errors.address.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                  <input
                    type="text"
                    {...register('city')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white placeholder:text-gray-400"
                  />
                  {errors.city && (
                    <p className="text-red-600 text-sm mt-1">{errors.city.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                  <input
                    type="text"
                    {...register('state')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white placeholder:text-gray-400"
                  />
                  {errors.state && (
                    <p className="text-red-600 text-sm mt-1">{errors.state.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code</label>
                  <input
                    type="text"
                    {...register('zip')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white placeholder:text-gray-400"
                  />
                  {errors.zip && (
                    <p className="text-red-600 text-sm mt-1">{errors.zip.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                  <input
                    type="text"
                    {...register('country')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white placeholder:text-gray-400"
                  />
                  {errors.country && (
                    <p className="text-red-600 text-sm mt-1">{errors.country.message}</p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'Place Order'}
              </button>
            </form>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 sticky top-20">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>

              <div className="space-y-4 mb-6">
                {items.map((item) => {
                  const mainImage = item.product.images && item.product.images.length > 0 
                    ? item.product.images[0] 
                    : 'https://via.placeholder.com/200x200?text=No+Image'

                  return (
                    <div key={item.product.id} className="flex items-center space-x-3">
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0">
                        <Image
                          src={mainImage}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-grow">
                        <p className="text-sm font-medium text-gray-900">{item.product.name}</p>
                        <p className="text-sm text-gray-600">
                          {item.quantity} × {formatCurrency(item.product.price)}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency(getTotal())}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-gray-900">
                  <span>Total</span>
                  <span>{formatCurrency(getTotal())}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

