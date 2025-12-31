'use client'

import { useCartStore } from '@/store/cart-store'
import Image from 'next/image'
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils/currency'

export default function CartPage() {
  const items = useCartStore((state) => state.items)
  const updateQuantity = useCartStore((state) => state.updateQuantity)
  const removeItem = useCartStore((state) => state.removeItem)
  const getTotal = useCartStore((state) => state.getTotal)
  const clearCart = useCartStore((state) => state.clearCart)

  const total = getTotal()

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag className="w-24 h-24 text-gray-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Your cart is empty</h2>
          <p className="text-gray-400 mb-8">Start shopping to add items to your cart</p>
          <Link
            href="/products"
            className="inline-block px-8 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-all"
          >
            Browse Products
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-white mb-8">Shopping Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => {
              const mainImage = item.product.images && item.product.images.length > 0 
                ? item.product.images[0] 
                : 'https://via.placeholder.com/200x200?text=No+Image'

              return (
                <div
                  key={item.product.id}
                  className="bg-gray-900 rounded-xl p-6 border border-white/10 flex items-start space-x-4"
                >
                  <Link href={`/products/${item.product.id}`}>
                    <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-black border border-white/10 flex-shrink-0">
                      <Image
                        src={mainImage}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </Link>

                  <div className="flex-grow">
                    <Link href={`/products/${item.product.id}`}>
                      <h3 className="font-semibold text-white mb-1 hover:text-blue-500 transition-colors">
                        {item.product.name}
                      </h3>
                    </Link>
                    <p className="text-gray-400 text-sm mb-2 line-clamp-2">
                      {item.product.description}
                    </p>
                    <p className="text-lg font-bold text-white mb-4">
                      {formatCurrency(item.product.price)}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="w-8 h-8 border border-white/10 bg-gray-800 rounded-lg hover:bg-gray-700 text-white flex items-center justify-center transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-12 text-center font-medium text-white">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          disabled={item.quantity >= item.product.stock}
                          className="w-8 h-8 border border-white/10 bg-gray-800 rounded-lg hover:bg-gray-700 text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="text-right">
                        <p className="text-sm text-gray-400">Subtotal</p>
                        <p className="text-lg font-bold text-white">
                          {formatCurrency(item.product.price * item.quantity)}
                        </p>
                      </div>

                      <button
                        onClick={() => removeItem(item.product.id)}
                        className="p-2 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}

            <button
              onClick={clearCart}
              className="text-red-400 hover:text-red-300 font-medium text-sm transition-colors"
            >
              Clear Cart
            </button>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-gray-900 rounded-xl p-6 border border-white/10 sticky top-20">
              <h2 className="text-xl font-bold text-white mb-4">Order Summary</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-400">
                  <span>Subtotal</span>
                  <span>{formatCurrency(total)}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Shipping</span>
                  <span>Calculated at checkout</span>
                </div>
                <div className="border-t border-white/10 pt-3 flex justify-between text-lg font-bold text-white">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>

              <Link
                href="/checkout"
                className="block w-full py-4 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-all text-center"
              >
                Proceed to Checkout
              </Link>

              <Link
                href="/products"
                className="block w-full mt-4 text-center text-gray-400 hover:text-white font-medium transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

