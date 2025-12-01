'use client'

import { useCartStore } from '@/store/cart-store'
import { ShoppingCart } from 'lucide-react'
import { useState } from 'react'
import type { Product } from '@/types/database'

interface AddToCartButtonProps {
  product: Product
}

export default function AddToCartButton({ product }: AddToCartButtonProps) {
  const addItem = useCartStore((state) => state.addItem)
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)

  const handleAddToCart = () => {
    if (product.stock > 0 && quantity > 0 && quantity <= product.stock) {
      addItem(product, quantity)
      setAdded(true)
      setTimeout(() => setAdded(false), 2000)
    }
  }

  if (product.stock === 0) {
    return (
      <button
        disabled
        className="w-full py-4 bg-gray-900 text-gray-500 font-semibold rounded-lg cursor-not-allowed border border-white/10"
      >
        Out of Stock
      </button>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <label className="text-sm font-medium text-gray-300">Quantity:</label>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="w-10 h-10 border border-white/10 bg-gray-900 rounded-lg hover:bg-gray-800 text-white flex items-center justify-center transition-colors"
          >
            -
          </button>
          <input
            type="number"
            min="1"
            max={product.stock}
            value={quantity}
            onChange={(e) => {
              const val = parseInt(e.target.value) || 1
              setQuantity(Math.min(Math.max(1, val), product.stock))
            }}
            className="w-16 h-10 text-center bg-gray-900 border border-white/10 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
            className="w-10 h-10 border border-white/10 bg-gray-900 rounded-lg hover:bg-gray-800 text-white flex items-center justify-center transition-colors"
          >
            +
          </button>
        </div>
      </div>

      <button
        onClick={handleAddToCart}
        className={`w-full py-4 font-semibold rounded-lg transition-all ${
          added
            ? 'bg-green-500 text-white'
            : 'bg-blue-500 text-white hover:bg-blue-600'
        }`}
      >
        {added ? (
          <span className="flex items-center justify-center space-x-2">
            <span>✓ Added to Cart</span>
          </span>
        ) : (
          <span className="flex items-center justify-center space-x-2">
            <ShoppingCart className="w-5 h-5" />
            <span>Add to Cart</span>
          </span>
        )}
      </button>
    </div>
  )
}

