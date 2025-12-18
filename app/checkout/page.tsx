'use client'

import { useCartStore } from '@/store/cart-store'
import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Image from 'next/image'
import { formatCurrency } from '@/lib/utils/currency'
import { countriesData, getStatesByCountryCode, type Country, type State } from '@/lib/data/countries-states'
import { MapPin, ChevronDown } from 'lucide-react'

const checkoutSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  zip: z.string().optional(),
  country: z.string().min(2, 'Country is required'),
})

type CheckoutFormData = z.infer<typeof checkoutSchema>

function CheckoutPageContent() {
  const items = useCartStore((state) => state.items)
  const getTotal = useCartStore((state) => state.getTotal)
  const clearCart = useCartStore((state) => state.clearCart)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [savedAddresses, setSavedAddresses] = useState<any[]>([])
  const [selectedCountry, setSelectedCountry] = useState<string>('')
  const [availableStates, setAvailableStates] = useState<State[]>([])
  const [existingOrderId, setExistingOrderId] = useState<string | null>(null)
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const [paymentCompleted, setPaymentCompleted] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      country: 'NG', // Default to Nigeria
    },
  })

  const watchedCountry = watch('country')

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
      
      // Check if we're resuming an existing order
      const orderId = searchParams.get('orderId')
      if (orderId) {
        setExistingOrderId(orderId)
        // Load existing order data
        const { data: order } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .eq('user_id', data.user.id)
          .single()
        
        if (order && order.status === 'pending') {
          // Pre-fill form with order data
          if (order.shipping_address) {
            setValue('name', order.shipping_address.name || '')
            setValue('address', order.shipping_address.address || '')
            setValue('city', order.shipping_address.city || '')
            setValue('state', order.shipping_address.state || '')
            setValue('zip', order.shipping_address.zip || '')
            setValue('country', order.shipping_address.country || 'NG')
          }
        }
      }
      
      // Load saved addresses
      const { data: addresses } = await supabase
        .from('user_addresses')
        .select('*')
        .eq('user_id', data.user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false })
      
      if (addresses && addresses.length > 0) {
        setSavedAddresses(addresses)
      }
      
      setCheckingAuth(false)
    }

    checkAuth()
  }, [setValue, router, searchParams])

  // Update available states when country changes
  useEffect(() => {
    if (watchedCountry) {
      const states = getStatesByCountryCode(watchedCountry)
      setAvailableStates(states)
      setSelectedCountry(watchedCountry)
      // Reset state when country changes
      setValue('state', '')
    }
  }, [watchedCountry, setValue])

  useEffect(() => {
    if (items.length === 0 && !checkingAuth) {
      router.push('/cart')
    }
  }, [items, router, checkingAuth])

  const loadAddress = (address: any) => {
    setValue('name', address.name)
    setValue('address', address.address)
    setValue('city', address.city)
    setValue('state', address.state)
    setValue('zip', address.zip || '')
    setValue('country', address.country || 'NG')
  }

  const handleCancelOrder = async () => {
    if (!currentOrderId || cancelling) return

    setCancelling(true)
    const supabase = createClient()

    try {
      // Update order status to cancelled
      const { error } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', currentOrderId)

      if (error) {
        console.error('Error cancelling order:', error)
        alert('Failed to cancel order. Please try again.')
        setCancelling(false)
        return
      }

      // Redirect to order page showing cancelled status
      router.push(`/orders/${currentOrderId}?status=cancelled`)
    } catch (error: any) {
      console.error('Error cancelling order:', error)
      alert('Failed to cancel order. Please try again.')
      setCancelling(false)
    }
  }

  const handlePaymentCompleted = async () => {
    if (!currentOrderId) return

    setPaymentCompleted(true)
    setLoading(false)
    
    // Redirect to payment verification/order page
    // The verification will check if payment was actually made
    router.push(`/orders/${currentOrderId}?verify=payment`)
  }

  const onSubmit = async (data: CheckoutFormData) => {
    setLoading(true)
    const supabase = createClient()

    try {
      let order
      let orderError

      // If resuming an existing order, update it instead of creating new one
      if (existingOrderId) {
        const { data: existingOrder } = await supabase
          .from('orders')
          .select('*')
          .eq('id', existingOrderId)
          .eq('user_id', user?.id)
          .single()

        if (existingOrder && existingOrder.status === 'pending') {
          // Update existing order
          const { data: updatedOrder, error: updateError } = await supabase
            .from('orders')
            .update({
              email: data.email,
              total: getTotal(),
              shipping_address: {
                name: data.name,
                address: data.address,
                city: data.city,
                state: data.state,
                zip: data.zip || '',
                country: data.country,
              },
            })
            .eq('id', existingOrderId)
            .select()
            .single()
          
          order = updatedOrder
          orderError = updateError
        } else {
          // Order doesn't exist or is not pending, create new one
          const { data: newOrder, error: newOrderError } = await supabase
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
                zip: data.zip || '',
                country: data.country,
              },
            })
            .select()
            .single()
          
          order = newOrder
          orderError = newOrderError
        }
      } else {
        // Create new order
        const { data: newOrder, error: newOrderError } = await supabase
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
              zip: data.zip || '',
              country: data.country,
            },
          })
          .select()
          .single()
        
        order = newOrder
        orderError = newOrderError
      }

      if (orderError) {
        console.error('Order creation error:', orderError)
        throw new Error(orderError.message || `Failed to create order: ${orderError.code || 'Unknown error'}`)
      }

      if (!order) {
        throw new Error('Order was not created successfully')
      }

      // Store order ID for potential cancellation
      setCurrentOrderId(order.id)

      // Create order items (only if this is a new order, not resuming)
      if (!existingOrderId) {
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
      } else {
        // For existing orders, ensure order items exist (they should already exist)
        const { data: existingItems } = await supabase
          .from('order_items')
          .select('id')
          .eq('order_id', order.id)
        
        if (!existingItems || existingItems.length === 0) {
          // If no items exist, create them from cart
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
        }
      }

      // Initialize Paystack payment
      console.log('Initializing Paystack payment for order:', order.id)
      
      let response: Response
      try {
        response = await fetch('/api/paystack/initialize', {
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
      } catch (fetchError: any) {
        console.error('Network error initializing payment:', fetchError)
        setLoading(false)
        throw new Error('Network error: Unable to connect to payment service. Please check your internet connection and try again.')
      }

      console.log('Paystack initialize response status:', response.status)

      if (!response.ok) {
        let errorData: any = {}
        try {
          errorData = await response.json()
        } catch (parseError) {
          // If response is not JSON, use status text
          console.error('Failed to parse error response:', parseError)
          errorData = { error: `Payment initialization failed: ${response.status} ${response.statusText}` }
        }
        console.error('Paystack initialization error response:', errorData)
        setLoading(false)
        throw new Error(errorData.error || errorData.message || `Payment initialization failed: ${response.status} ${response.statusText}`)
      }

      let paymentData: any
      try {
        paymentData = await response.json()
      } catch (parseError) {
        console.error('Failed to parse payment response:', parseError)
        setLoading(false)
        throw new Error('Invalid response from payment service. Please try again.')
      }
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
        
        // Store order ID for potential redirect
        const currentOrderId = order.id

        // Set up window focus listener to detect when popup closes
        let popupClosed = false
        const handleWindowFocus = () => {
          // When window regains focus, check if we're still on checkout
          // If popup was closed without payment, Paystack may not call callback
          // So we check after a short delay
          setTimeout(() => {
            // Check if we're still on checkout page and still loading
            // This means popup was likely closed without completing payment
            if (window.location.pathname === '/checkout' && loading && !paymentCompleted) {
              console.log('Popup likely closed without payment')
              popupClosed = true
              setLoading(false)
              // Don't redirect immediately - show "I've completed payment" button instead
            }
          }, 2000) // Wait 2 seconds to see if callback fires
        }

        window.addEventListener('focus', handleWindowFocus)

        // Open payment popup
        paystack.resumeTransaction(paymentData.access_code)
        
        console.log('Paystack popup opened successfully')
        
        // Clean up listener after 10 minutes (payment should complete by then)
        const cleanupTimeout = setTimeout(() => {
          window.removeEventListener('focus', handleWindowFocus)
          if (loading && !paymentCompleted) {
            setLoading(false)
          }
        }, 600000) // 10 minutes

        // Clean up on component unmount or when payment completes
        return () => {
          window.removeEventListener('focus', handleWindowFocus)
          clearTimeout(cleanupTimeout)
        }
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
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Shipping Information</h2>
                {savedAddresses.length > 0 && (
                  <div className="relative">
                    <select
                      onChange={(e) => {
                        const addressId = e.target.value
                        if (addressId) {
                          const address = savedAddresses.find((a) => a.id === addressId)
                          if (address) {
                            loadAddress(address)
                          }
                        }
                        e.target.value = '' // Reset select
                      }}
                      className="appearance-none bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 pr-8 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Use Saved Address</option>
                      {savedAddresses.map((address) => (
                        <option key={address.id} value={address.id}>
                          {address.name} - {address.city}, {address.state}
                          {address.is_default && ' (Default)'}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-700 pointer-events-none" />
                  </div>
                )}
              </div>

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
                  <div className="relative">
                    <select
                      {...register('state')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white appearance-none cursor-pointer"
                      disabled={!selectedCountry || availableStates.length === 0}
                    >
                      <option value="">
                        {!selectedCountry
                          ? 'Select country first'
                          : availableStates.length === 0
                          ? 'No states available'
                          : 'Select state'}
                      </option>
                      {availableStates.map((state) => (
                        <option key={state.code} value={state.name}>
                          {state.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>
                  {errors.state && (
                    <p className="text-red-600 text-sm mt-1">{errors.state.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ZIP Code <span className="text-gray-400 text-xs font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    {...register('zip')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white placeholder:text-gray-400"
                    placeholder="Enter ZIP/Postal code"
                  />
                  {errors.zip && (
                    <p className="text-red-600 text-sm mt-1">{errors.zip.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                  <div className="relative">
                    <select
                      {...register('country')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white appearance-none cursor-pointer"
                    >
                      {countriesData.map((country) => (
                        <option key={country.code} value={country.code}>
                          {country.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>
                  {errors.country && (
                    <p className="text-red-600 text-sm mt-1">{errors.country.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                {!paymentCompleted ? (
                  <>
                    <button
                      type="submit"
                      disabled={loading || cancelling}
                      className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Processing...' : 'Place Order'}
                    </button>
                    {loading && currentOrderId && (
                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={handlePaymentCompleted}
                          disabled={cancelling}
                          className="w-full py-2 text-sm bg-green-50 text-green-700 hover:bg-green-100 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-green-200"
                        >
                          I've Completed Payment
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelOrder}
                          disabled={cancelling}
                          className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200"
                        >
                          {cancelling ? 'Cancelling...' : 'Cancel Order'}
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-600 mb-3">Verifying your payment...</p>
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  </div>
                )}
              </div>
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

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <CheckoutPageContent />
    </Suspense>
  )
}

