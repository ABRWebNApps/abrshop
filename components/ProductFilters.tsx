'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { Search, X } from 'lucide-react'
import type { Category } from '@/types/database'

interface ProductFiltersProps {
  categories: Category[]
}

export default function ProductFilters({ categories }: ProductFiltersProps) {
  const router = useRouter()
  const params = useSearchParams()
  const [search, setSearch] = useState(params.get('search') || '')
  const [selectedCategory, setSelectedCategory] = useState(params.get('category') || '')
  const [condition, setCondition] = useState(params.get('condition') || 'any')
  const [sortBy, setSortBy] = useState(params.get('sort') || 'created_at')
  const [sortOrder, setSortOrder] = useState(params.get('order') || 'desc')

  const updateFilters = (updates: Record<string, string>) => {
    const newParams = new URLSearchParams(params.toString())
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        newParams.set(key, value)
      } else {
        newParams.delete(key)
      }
    })

    router.push(`/products?${newParams.toString()}`)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateFilters({ search })
  }

  const clearFilters = () => {
    setSearch('')
    setSelectedCategory('')
    setSortBy('created_at')
    setSortOrder('desc')
    router.push('/products')
  }

  return (
    <div className="bg-gray-900 rounded-xl p-3 border border-white/10">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={selectedCategory}
          onChange={(e) => {
            setSelectedCategory(e.target.value)
            updateFilters({ category: e.target.value })
          }}
          className="px-4 py-2 bg-black border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 appearance-none cursor-pointer flex-1 min-w-[140px]"
        >
          <option value="">All Categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>

        <select
          value={condition}
          onChange={(e) => {
            setCondition(e.target.value)
            if (e.target.value !== 'any') {
              updateFilters({ condition: e.target.value })
            } else {
              const newParams = new URLSearchParams(params.toString())
              newParams.delete('condition')
              router.push(`/products?${newParams.toString()}`)
            }
          }}
          className="px-4 py-2 bg-black border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 appearance-none cursor-pointer flex-1 min-w-[140px]"
        >
          <option value="any">Any Condition</option>
          <option value="new">New</option>
          <option value="used">Used</option>
          <option value="refurbished">Refurbished</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => {
            setSortBy(e.target.value)
            updateFilters({ sort: e.target.value, order: sortOrder })
          }}
          className="px-4 py-2 bg-black border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 appearance-none cursor-pointer flex-1 min-w-[140px]"
        >
          <option value="created_at">Newest</option>
          <option value="name">Name</option>
          <option value="price">Price</option>
        </select>
      </div>
    </div>
  )
}

