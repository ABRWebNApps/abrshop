import { createClient } from '@/lib/supabase/server'
import ProductCard from '@/components/ProductCard'
import { Suspense } from 'react'
import ProductFilters from '@/components/ProductFilters'

type SearchParams = { [key: string]: string | string[] | undefined }

async function getProducts(searchParams: SearchParams | undefined) {
  const supabase = await createClient()
  
  // Helper to get string value from searchParams
  const getParam = (key: string): string | undefined => {
    if (!searchParams) return undefined
    const value = searchParams[key]
    if (value === undefined || value === null) return undefined
    if (Array.isArray(value)) return value[0]
    if (typeof value === 'string') return value
    return undefined
  }

  try {
    // First, try to query products table directly to check if it exists
    const { data: testData, error: testError } = await supabase
      .from('products')
      .select('id')
      .limit(1)

    if (testError) {
      console.error('❌ Products table not found in database!')
      console.error('Error code:', testError.code)
      console.error('Error message:', testError.message)
      console.error('')
      console.error('📋 To fix this issue:')
      console.error('1. Go to your Supabase Dashboard')
      console.error('2. Navigate to SQL Editor')
      console.error('3. Run the supabase-schema.sql file to create all tables')
      console.error('4. Verify the tables exist in Table Editor')
      console.error('5. Make sure you are using the correct Supabase project URL and API key')
      console.error('')
      console.error('Full error details:', JSON.stringify(testError, null, 2))
      return []
    }

    // Build the query with join
    let query = supabase
      .from('products')
      .select('*, category:categories(*), brand:brands(*), tags:product_tags(tag:tags(*))')
      .gt('stock', 0)

    // Category filter
    const category = getParam('category')
    if (category) {
      query = query.eq('category_id', category)
    }

    // Brand filter
    const brands = getParam('brands')
    if (brands) {
      const brandIds = brands.split(',').filter(Boolean)
      if (brandIds.length > 0) {
        query = query.in('brand_id', brandIds)
      }
    }

    // Search - includes name, description, brand name, and tags
    const search = getParam('search')
    if (search) {
      // Get all matching product IDs from different sources
      const productIds = new Set<string>()

      // 1. Products matching name or description
      const { data: nameDescProducts } = await supabase
        .from('products')
        .select('id')
        .or(`name.ilike.%${search}%,description.ilike.%${search}%`)
        .gt('stock', 0)

      if (nameDescProducts) {
        nameDescProducts.forEach((p: any) => productIds.add(p.id))
      }

      // 2. Products by brand name
      const { data: matchingBrands } = await supabase
        .from('brands')
        .select('id')
        .ilike('name', `%${search}%`)

      if (matchingBrands && matchingBrands.length > 0) {
        const brandIds = matchingBrands.map(b => b.id)
        const { data: brandProducts } = await supabase
          .from('products')
          .select('id')
          .in('brand_id', brandIds)
          .gt('stock', 0)

        if (brandProducts) {
          brandProducts.forEach((p: any) => productIds.add(p.id))
        }
      }

      // 3. Products by tags
      const { data: matchingTags } = await supabase
        .from('tags')
        .select('id')
        .ilike('name', `%${search}%`)

      if (matchingTags && matchingTags.length > 0) {
        const tagIds = matchingTags.map(t => t.id)
        const { data: taggedProducts } = await supabase
          .from('product_tags')
          .select('product_id')
          .in('tag_id', tagIds)

        if (taggedProducts) {
          taggedProducts.forEach((pt: any) => productIds.add(pt.product_id))
        }
      }

      // Apply filter if we have matching products
      if (productIds.size > 0) {
        query = query.in('id', Array.from(productIds))
      } else {
        // Return empty if no matches
        return []
      }
    }

    // Sort
    const sortBy = getParam('sort') || 'created_at'
    const sortOrder = getParam('order') === 'asc' ? 'asc' : 'desc'
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    const { data, error } = await query

    if (error) {
      console.error('Error fetching products:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      
      // Try fallback query without join if join fails
      if (error.code === 'PGRST116' || error.message?.includes('relation') || error.message?.includes('schema')) {
        console.log('Attempting fallback query without category join...')
        const fallbackQuery = supabase
          .from('products')
          .select('*')
          .gt('stock', 0)
        
        const category = getParam('category')
        if (category) {
          fallbackQuery.eq('category_id', category)
        }
        
        const { data: fallbackData, error: fallbackError } = await fallbackQuery
        
        if (fallbackError) {
          console.error('Fallback query also failed:', fallbackError)
          return []
        }
        
        return fallbackData || []
      }
      
      return []
    }

    console.log(`Fetched ${data?.length || 0} products`)
    return data || []
  } catch (err) {
    console.error('Unexpected error in getProducts:', err)
    return []
  }
}

async function getCategories() {
  const supabase = await createClient()
  const { data } = await supabase.from('categories').select('*').order('name')
  return data || []
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams?: SearchParams | Promise<SearchParams>
}) {
  // Handle both sync and async searchParams (Next.js 15+ compatibility)
  const resolvedSearchParams: SearchParams = searchParams instanceof Promise 
    ? await searchParams 
    : (searchParams || {})
  const products = await getProducts(resolvedSearchParams)
  const categories = await getCategories()

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-8">
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">All Products</h1>
            <p className="text-gray-400 text-sm md:text-base">Browse the complete ABR collection.</p>
          </div>
          <div className="w-full md:w-auto">
            <Suspense fallback={<div className="text-white">Loading filters...</div>}>
              <ProductFilters categories={categories} />
            </Suspense>
          </div>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} showNewBadge={true} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-gray-900 rounded-2xl border border-white/10">
            <p className="text-gray-400 text-lg mb-4">No products found.</p>
            <p className="text-gray-500">Try adjusting your filters or search terms.</p>
          </div>
        )}
      </div>
    </div>
  )
}

