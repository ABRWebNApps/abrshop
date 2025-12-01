'use client'

import { useEffect, useRef } from 'react'
import ProductCard from './ProductCard'
import type { Product } from '@/types/database'

interface ProductSliderProps {
  products: Product[]
}

export default function ProductSlider({ products }: ProductSliderProps) {
  const sliderRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!sliderRef.current) return

    const slider = sliderRef.current
    let animationId: number
    let position = 0
    const speed = 0.5 // pixels per frame

    const animate = () => {
      position -= speed
      
      // Reset position when we've scrolled past all items
      const totalWidth = slider.scrollWidth / 2 // Since we duplicate items
      if (Math.abs(position) >= totalWidth) {
        position = 0
      }
      
      slider.style.transform = `translateX(${position}px)`
      animationId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [products])

  // Duplicate products for seamless loop
  const duplicatedProducts = [...products, ...products]

  if (products.length === 0) return null

  return (
    <div className="relative overflow-hidden w-full -mx-4 px-4 md:mx-0 md:px-0">
      <div
        ref={sliderRef}
        className="flex gap-3 md:gap-4 lg:gap-6"
        style={{ willChange: 'transform' }}
      >
        {duplicatedProducts.map((product, index) => (
          <div key={`${product.id}-${index}`} className="flex-shrink-0 w-[240px] sm:w-[280px] md:w-[300px] lg:w-[320px]">
            <ProductCard product={product} showNewBadge={true} />
          </div>
        ))}
      </div>
    </div>
  )
}

