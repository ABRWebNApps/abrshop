import { createClient } from '@/lib/supabase/server'
import BannerManagement from '@/components/admin/BannerManagement'

async function getBanners() {
  const supabase = await createClient()
  const { data } = await supabase.from('banners').select('*').order('created_at', { ascending: false })

  return data || []
}

export default async function BannersPage() {
  const banners = await getBanners()

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Banner Management</h1>
        <p className="text-gray-400">Manage homepage banners and promotions</p>
      </div>
      <BannerManagement initialBanners={banners} />
    </div>
  )
}

