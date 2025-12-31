import { createClient } from '@/lib/supabase/server'
import ProductCard from '@/components/ProductCard'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

async function getNewArrivals() {
  const supabase = await createClient()
  
  // Get products marked as new arrivals OR created in the last 30 days
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  
  const { data, error } = await supabase
    .from('products')
    .select('*, category:categories(*), brand:brands(*), tags:product_tags(tag:tags(*))')
    .gt('stock', 0)
    .or(`is_new_arrival.eq.true,created_at.gte.${thirtyDaysAgo.toISOString()}`)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching new arrivals:', error)
    // Fallback: just get recent products if is_new_arrival column doesn't exist
    const { data: fallbackData } = await supabase
      .from('products')
      .select('*, category:categories(*), brand:brands(*), tags:product_tags(tag:tags(*))')
      .gt('stock', 0)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false })
    return fallbackData || []
  }

  return data || []
}

export default async function NewArrivalsPage() {
  const products = await getNewArrivals()

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <Link
          href="/"
          className="inline-flex items-center space-x-2 text-gray-400 hover:text-white mb-6 md:mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
          <span className="text-sm md:text-base">Back to Home</span>
        </Link>

        <div className="mb-8">
          <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-500/50 px-3 md:px-4 py-1.5 md:py-2 rounded-full mb-4">
            <span className="text-xs md:text-sm font-medium text-blue-400 uppercase tracking-wider">NEW ARRIVALS</span>
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2">
            Latest Products
          </h1>
          <p className="text-gray-400 text-sm md:text-base">
            Discover our newest additions to the collection
          </p>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} showNewBadge={true} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-gray-900 rounded-2xl border border-white/10">
            <p className="text-gray-400 text-lg mb-4">No new arrivals at the moment.</p>
            <p className="text-gray-500 text-sm">Check back soon for new products!</p>
            <Link
              href="/products"
              className="inline-block mt-6 text-blue-500 hover:text-blue-400 font-medium"
            >
              Browse All Products
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

