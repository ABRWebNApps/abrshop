import { createClient } from '@/lib/supabase/server'
import OrdersList from '@/components/admin/OrdersList'

async function getOrders() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('orders')
    .select('*, items:order_items(*, product:products(*))')
    .order('created_at', { ascending: false })

  return data || []
}

export default async function OrdersPage() {
  const orders = await getOrders()

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Orders</h1>
        <p className="text-gray-600">View and manage customer orders</p>
      </div>
      <OrdersList initialOrders={orders} />
    </div>
  )
}

