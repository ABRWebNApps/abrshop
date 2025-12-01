import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Package, CheckCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/currency'

async function getOrder(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('orders')
    .select('*, items:order_items(*, product:products(*))')
    .eq('id', id)
    .single()

  if (error || !data) return null
  return data
}

export default async function OrderPage({ 
  params 
}: { 
  params: Promise<{ id: string }> | { id: string } 
}) {
  // Handle both sync and async params (Next.js 15+ compatibility)
  const resolvedParams = params instanceof Promise ? await params : params
  const order = await getOrder(resolvedParams.id)

  if (!order) {
    notFound()
  }

  const items = (order.items as any[]) || []

  return (
    <div className="min-h-screen bg-black py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gray-900 rounded-xl shadow-sm border border-white/10 p-6 md:p-8">
          <div className="flex items-center space-x-3 mb-6">
            <CheckCircle className="w-8 h-8 text-green-500" />
            <div>
              <h1 className="text-3xl font-bold text-white">Order Confirmed</h1>
              <p className="text-gray-400">Order #{order.id.slice(0, 8)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <h2 className="font-semibold text-white mb-2">Shipping Address</h2>
              <div className="text-gray-300">
                <p>{order.shipping_address.name}</p>
                <p>{order.shipping_address.address}</p>
                <p>
                  {order.shipping_address.city}, {order.shipping_address.state}{' '}
                  {order.shipping_address.zip}
                </p>
                <p>{order.shipping_address.country}</p>
              </div>
            </div>
            <div>
              <h2 className="font-semibold text-white mb-2">Order Details</h2>
              <div className="text-gray-300 space-y-1">
                <p>
                  <span className="font-medium">Status:</span>{' '}
                  <span className="capitalize">{order.status}</span>
                </p>
                <p>
                  <span className="font-medium">Date:</span>{' '}
                  {new Date(order.created_at).toLocaleDateString()}
                </p>
                <p>
                  <span className="font-medium">Email:</span> {order.email}
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6">
            <h2 className="font-semibold text-white mb-4">Order Items</h2>
            <div className="space-y-4">
              {items.map((item: any) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-4 border-b border-white/10"
                >
                  <div>
                    <p className="font-medium text-white">{item.product?.name || 'Product'}</p>
                    <p className="text-sm text-gray-400">Quantity: {item.quantity}</p>
                  </div>
                  <p className="font-medium text-white">
                    {formatCurrency(item.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-between items-center pt-4 border-t border-white/10">
              <span className="text-xl font-bold text-white">Total</span>
              <span className="text-xl font-bold text-white">{formatCurrency(order.total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

