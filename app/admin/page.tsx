import { createClient } from '@/lib/supabase/server'
import ProductManagement from '@/components/admin/ProductManagement'

async function getProducts() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select('*, category:categories(*)')
    .order('created_at', { ascending: false })

  return data || []
}

async function getCategories() {
  const supabase = await createClient()
  const { data } = await supabase.from('categories').select('*').order('name')

  return data || []
}

export default async function AdminPage() {
  const products = await getProducts()
  const categories = await getCategories()

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Product Management</h1>
        <p className="text-gray-400">Create, edit, and manage your products</p>
      </div>
      <ProductManagement initialProducts={products} categories={categories} />
    </div>
  )
}

