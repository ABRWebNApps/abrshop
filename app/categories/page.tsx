import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

async function getCategories() {
  const supabase = await createClient()
  const { data } = await supabase.from('categories').select('*').order('name')

  return data || []
}

async function getCategoryProducts(categoryId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select('*')
    .eq('category_id', categoryId)
    .gt('stock', 0)
    .limit(4)

  return data || []
}

export default async function CategoriesPage() {
  const categories = await getCategories()

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Categories</h1>
          <p className="text-gray-600">Browse products by category</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map(async (category) => {
            const products = await getCategoryProducts(category.id)
            return (
              <Link
                key={category.id}
                href={`/products?category=${category.id}`}
                className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all group"
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {category.name}
                </h2>
                {category.description && (
                  <p className="text-gray-600 mb-4 line-clamp-2">{category.description}</p>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">{products.length} products</span>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            )
          })}
        </div>

        {categories.length === 0 && (
          <div className="text-center py-20 bg-white rounded-lg">
            <p className="text-gray-500 text-lg">No categories available yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}

