import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import AddToCartButton from '@/components/AddToCartButton'
import ProductCard from '@/components/ProductCard'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils/currency'

async function getProduct(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select('*, category:categories(*)')
    .eq('id', id)
    .single()

  if (error || !data) {
    console.error('Error fetching product:', error)
    return null
  }
  return data
}

async function getSimilarProducts(categoryId: string | null, currentProductId: string) {
  const supabase = await createClient()
  
  let query = supabase
    .from('products')
    .select('*, category:categories(*)')
    .neq('id', currentProductId)
    .gt('stock', 0)
    .limit(4)

  if (categoryId) {
    query = query.eq('category_id', categoryId)
  }

  const { data } = await query
  return data || []
}

export default async function ProductPage({ 
  params 
}: { 
  params: Promise<{ id: string }> | { id: string } 
}) {
  // Handle both sync and async params (Next.js 15+ compatibility)
  const resolvedParams = params instanceof Promise ? await params : params
  const product = await getProduct(resolvedParams.id)

  if (!product) {
    notFound()
  }

  const similarProducts = await getSimilarProducts(product.category_id, product.id)
  const mainImage = product.images && product.images.length > 0 ? product.images[0] : 'https://via.placeholder.com/800x800?text=No+Image'
  const otherImages = product.images?.slice(1) || []

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/products"
          className="inline-flex items-center space-x-2 text-gray-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Products</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Images */}
          <div className="space-y-4">
            <div className="relative aspect-square overflow-hidden rounded-2xl bg-gray-900 border border-white/10">
              <Image
                src={mainImage}
                alt={product.name}
                fill
                className="object-cover"
                priority
              />
            </div>
            {otherImages.length > 0 && (
              <div className="grid grid-cols-4 gap-4">
                {otherImages.map((image: string, index: number) => (
                  <div key={index} className="relative aspect-square overflow-hidden rounded-xl bg-gray-900 border border-white/10">
                    <Image
                      src={image}
                      alt={`${product.name} ${index + 2}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="sticky top-20 h-fit">
            <div className="mb-4">
              {product.category && (
                <Link
                  href={`/products?category=${product.category.id}`}
                  className="text-sm text-blue-500 hover:text-blue-400 font-medium transition-colors"
                >
                  {product.category.name}
                </Link>
              )}
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">{product.name}</h1>
            <p className="text-3xl font-bold text-white mb-6">{formatCurrency(product.price)}</p>

            <div className="mb-8">
              <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>

            <div className="mb-8">
              <div className="flex items-center space-x-4 mb-4">
                <span className="text-sm font-medium text-gray-400">Stock:</span>
                {product.stock > 0 ? (
                  <span className="text-sm text-green-400 font-semibold">
                    {product.stock} available
                  </span>
                ) : (
                  <span className="text-sm text-red-400 font-semibold">Out of Stock</span>
                )}
              </div>
            </div>

            <AddToCartButton product={product} />

            {product.stock > 0 && product.stock < 10 && (
              <p className="text-sm text-orange-400 mt-4">
                ⚠️ Only {product.stock} left in stock - order soon!
              </p>
            )}
          </div>
        </div>

        {/* Similar Products */}
        {similarProducts.length > 0 && (
          <div className="mt-16 pt-16 border-t border-white/10">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">Similar Products</h2>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {similarProducts.map((similarProduct) => (
                <ProductCard key={similarProduct.id} product={similarProduct} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

