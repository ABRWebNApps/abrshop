'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Order } from '@/types/database'
import { Package, Eye, X } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/currency'
import Image from 'next/image'

interface OrdersListProps {
  initialOrders: Order[]
}

export default function OrdersList({ initialOrders }: OrdersListProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const supabase = createClient()

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)

    if (error) {
      alert('Error updating order: ' + error.message)
      return
    }

    setOrders(orders.map((o) => (o.id === orderId ? { ...o, status } : o)))
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Order ID
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Customer
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Items
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {orders.map((order) => (
            <tr key={order.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                  #{order.id.slice(0, 8)}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-900">{order.email}</div>
                <div className="text-sm text-gray-500">{order.shipping_address.name}</div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-900">
                  {(order.items as any[])?.length || 0} items
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{formatCurrency(order.total)}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    order.status === 'delivered'
                      ? 'bg-green-100 text-green-800'
                      : order.status === 'shipped'
                      ? 'bg-blue-100 text-blue-800'
                      : order.status === 'processing'
                      ? 'bg-yellow-100 text-yellow-800'
                      : order.status === 'cancelled'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {order.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-500">
                  {new Date(order.created_at).toLocaleDateString()}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex items-center justify-end space-x-2">
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="text-[#3b82f6] hover:text-[#60a5fa] p-2 transition-colors"
                    title="View Order Details"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  <select
                    value={order.status}
                    onChange={(e) => updateOrderStatus(order.id, e.target.value as Order['status'])}
                    className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6] min-w-[120px]"
                  >
                    <option value="pending" className="text-gray-900 bg-white">Pending</option>
                    <option value="processing" className="text-gray-900 bg-white">Processing</option>
                    <option value="shipped" className="text-gray-900 bg-white">Shipped</option>
                    <option value="delivered" className="text-gray-900 bg-white">Delivered</option>
                    <option value="cancelled" className="text-gray-900 bg-white">Cancelled</option>
                  </select>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {orders.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No orders yet</p>
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Order Details</h2>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Order Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Order Information</h3>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="font-medium text-gray-700">Order ID:</span>{' '}
                      <span className="text-gray-900">#{selectedOrder.id.slice(0, 8)}</span>
                    </p>
                    <p>
                      <span className="font-medium text-gray-700">Status:</span>{' '}
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        selectedOrder.status === 'delivered'
                          ? 'bg-green-100 text-green-800'
                          : selectedOrder.status === 'shipped'
                          ? 'bg-blue-100 text-blue-800'
                          : selectedOrder.status === 'processing'
                          ? 'bg-yellow-100 text-yellow-800'
                          : selectedOrder.status === 'cancelled'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedOrder.status}
                      </span>
                    </p>
                    <p>
                      <span className="font-medium text-gray-700">Date:</span>{' '}
                      <span className="text-gray-900">
                        {new Date(selectedOrder.created_at).toLocaleString()}
                      </span>
                    </p>
                    <p>
                      <span className="font-medium text-gray-700">Total:</span>{' '}
                      <span className="text-gray-900 font-semibold">{formatCurrency(selectedOrder.total)}</span>
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Customer Information</h3>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="font-medium text-gray-700">Email:</span>{' '}
                      <span className="text-gray-900">{selectedOrder.email}</span>
                    </p>
                    {selectedOrder.user_id && (
                      <p>
                        <span className="font-medium text-gray-700">User ID:</span>{' '}
                        <span className="text-gray-900">{selectedOrder.user_id.slice(0, 8)}...</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Shipping Address</h3>
                <div className="bg-gray-50 rounded-lg p-4 text-sm">
                  <p className="font-medium text-gray-900">{selectedOrder.shipping_address.name}</p>
                  <p className="text-gray-700">{selectedOrder.shipping_address.address}</p>
                  <p className="text-gray-700">
                    {selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.state}{' '}
                    {selectedOrder.shipping_address.zip}
                  </p>
                  <p className="text-gray-700">{selectedOrder.shipping_address.country}</p>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">Order Items</h3>
                <div className="space-y-4">
                  {(selectedOrder.items as any[])?.length > 0 ? (
                    (selectedOrder.items as any[]).map((item: any) => {
                      const product = item.product || {}
                      const mainImage = product.images && product.images.length > 0 
                        ? product.images[0] 
                        : 'https://via.placeholder.com/200x200?text=No+Image'

                      return (
                        <div key={item.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                          <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                            <Image
                              src={mainImage}
                              alt={product.name || 'Product'}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-grow">
                            <h4 className="font-medium text-gray-900">{product.name || 'Unknown Product'}</h4>
                            <p className="text-sm text-gray-600">
                              Quantity: {item.quantity} × {formatCurrency(item.price)}
                            </p>
                            {product.description && (
                              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                {product.description}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">
                              {formatCurrency(item.price * item.quantity)}
                            </p>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No items found in this order</p>
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">Total</span>
                    <span className="text-xl font-bold text-gray-900">{formatCurrency(selectedOrder.total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

