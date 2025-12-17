import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Package, FolderTree, Image as ImageIcon, ShoppingCart, Tag } from 'lucide-react'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.user_metadata?.role !== 'admin') {
    redirect('/auth/login?redirect=/admin')
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="flex">
        <aside className="w-64 bg-gradient-to-b from-[#1e3a8a] to-[#1e40af] border-r border-blue-600/30 min-h-screen sticky top-0 shadow-lg">
          <div className="p-6">
            <h2 className="text-xl font-bold text-white mb-8 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">Admin Dashboard</h2>
            <nav className="space-y-2">
              <Link
                href="/admin"
                className="flex items-center space-x-3 px-4 py-3 text-blue-100 hover:bg-blue-700/50 hover:text-white rounded-lg transition-colors border border-transparent hover:border-blue-400/30"
              >
                <Package className="w-5 h-5" />
                <span>Products</span>
              </Link>
              <Link
                href="/admin/categories"
                className="flex items-center space-x-3 px-4 py-3 text-blue-100 hover:bg-blue-700/50 hover:text-white rounded-lg transition-colors border border-transparent hover:border-blue-400/30"
              >
                <FolderTree className="w-5 h-5" />
                <span>Categories</span>
              </Link>
              <Link
                href="/admin/brands"
                className="flex items-center space-x-3 px-4 py-3 text-blue-100 hover:bg-blue-700/50 hover:text-white rounded-lg transition-colors border border-transparent hover:border-blue-400/30"
              >
                <Tag className="w-5 h-5" />
                <span>Brands</span>
              </Link>
              <Link
                href="/admin/banners"
                className="flex items-center space-x-3 px-4 py-3 text-blue-100 hover:bg-blue-700/50 hover:text-white rounded-lg transition-colors border border-transparent hover:border-blue-400/30"
              >
                <ImageIcon className="w-5 h-5" />
                <span>Banners</span>
              </Link>
              <Link
                href="/admin/orders"
                className="flex items-center space-x-3 px-4 py-3 text-blue-100 hover:bg-blue-700/50 hover:text-white rounded-lg transition-colors border border-transparent hover:border-blue-400/30"
              >
                <ShoppingCart className="w-5 h-5" />
                <span>Orders</span>
              </Link>
            </nav>
          </div>
        </aside>
        <main className="flex-1 p-8 bg-black">{children}</main>
      </div>
    </div>
  )
}

