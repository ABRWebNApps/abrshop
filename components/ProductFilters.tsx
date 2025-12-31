'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Category } from '@/types/database'

interface ProductFiltersProps {
  categories: Category[]
}

interface Brand {
  id: string
  name: string
  category_id: string
}

export default function ProductFilters({ categories }: ProductFiltersProps) {
  const router = useRouter()
  const params = useSearchParams()
  const [search, setSearch] = useState(params.get('search') || '')
  const [selectedCategory, setSelectedCategory] = useState(params.get('category') || '')
  const [condition, setCondition] = useState(params.get('condition') || 'any')
  const [sortBy, setSortBy] = useState(params.get('sort') || 'created_at')
  const [sortOrder, setSortOrder] = useState(params.get('order') || 'desc')
  const [brands, setBrands] = useState<Brand[]>([])
  const [selectedBrands, setSelectedBrands] = useState<string[]>(() => {
    const brandsParam = params.get('brands')
    return brandsParam ? brandsParam.split(',') : []
  })
  const [loadingBrands, setLoadingBrands] = useState(false)

  // Load brands when category changes
  useEffect(() => {
    const loadBrands = async () => {
      if (!selectedCategory) {
        setBrands([])
        return
      }

      setLoadingBrands(true)
      const supabase = createClient()
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .eq('category_id', selectedCategory)
        .order('name')

      if (!error && data) {
        setBrands(data)
      }
      setLoadingBrands(false)
    }

    loadBrands()
  }, [selectedCategory])

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

  const handleBrandToggle = (brandId: string) => {
    const newSelectedBrands = selectedBrands.includes(brandId)
      ? selectedBrands.filter(id => id !== brandId)
      : [...selectedBrands, brandId]
    
    setSelectedBrands(newSelectedBrands)
    
    if (newSelectedBrands.length > 0) {
      updateFilters({ brands: newSelectedBrands.join(',') })
    } else {
      const newParams = new URLSearchParams(params.toString())
      newParams.delete('brands')
      router.push(`/products?${newParams.toString()}`)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateFilters({ search })
  }

  const clearFilters = () => {
    setSearch('')
    setSelectedCategory('')
    setSelectedBrands([])
    setSortBy('created_at')
    setSortOrder('desc')
    router.push('/products')
  }

  return (
    <div className="bg-gray-900 rounded-xl p-4 md:p-6 border border-white/10">
      <div className="space-y-4">
        {/* Search Input */}
        <form onSubmit={handleSearch} className="w-full">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, brand, or tags..."
              className="w-full pl-10 pr-4 py-2 bg-black border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </form>

        {/* Category and Sort Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value)
              setSelectedBrands([]) // Clear brands when category changes
              updateFilters({ category: e.target.value, brands: '' })
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

        {/* Brand Filters - Only show when category is selected */}
        {selectedCategory && (
          <div className="border-t border-white/10 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold text-sm md:text-base">Filter by Brand</h3>
              {selectedBrands.length > 0 && (
                <button
                  onClick={() => {
                    setSelectedBrands([])
                    const newParams = new URLSearchParams(params.toString())
                    newParams.delete('brands')
                    router.push(`/products?${newParams.toString()}`)
                  }}
                  className="text-blue-500 hover:text-blue-400 text-xs md:text-sm"
                >
                  Clear Brands
                </button>
              )}
            </div>
            {loadingBrands ? (
              <p className="text-gray-400 text-sm">Loading brands...</p>
            ) : brands.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {brands.map((brand) => (
                  <label
                    key={brand.id}
                    className="flex items-center space-x-2 cursor-pointer hover:bg-gray-800 p-2 rounded-lg transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedBrands.includes(brand.id)}
                      onChange={() => handleBrandToggle(brand.id)}
                      className="w-4 h-4 text-blue-500 bg-black border-white/20 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <span className="text-white text-sm">{brand.name}</span>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">No brands available for this category</p>
            )}
          </div>
        )}

        {/* Clear All Filters */}
        {(selectedCategory || selectedBrands.length > 0 || search || condition !== 'any') && (
          <div className="border-t border-white/10 pt-4">
            <button
              onClick={clearFilters}
              className="w-full px-4 py-2 bg-black border border-white/10 rounded-lg text-white text-sm hover:bg-gray-800 transition-colors flex items-center justify-center space-x-2"
            >
              <X className="w-4 h-4" />
              <span>Clear All Filters</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

