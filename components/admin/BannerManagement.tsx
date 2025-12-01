'use client'

import { useState } from 'react'
import { Plus, Edit, Trash2, Upload, Calendar } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Banner } from '@/types/database'
import Image from 'next/image'

interface BannerManagementProps {
  initialBanners: Banner[]
}

export default function BannerManagement({ initialBanners }: BannerManagementProps) {
  const [banners, setBanners] = useState<Banner[]>(initialBanners)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    image_url: '',
    button_text: '',
    button_link: '',
    start_date: '',
    end_date: '',
    is_active: true,
  })

  const supabase = createClient()

  const handleOpenModal = (banner?: Banner) => {
    if (banner) {
      setEditingBanner(banner)
      setFormData({
        title: banner.title,
        subtitle: banner.subtitle || '',
        image_url: banner.image_url,
        button_text: banner.button_text || '',
        button_link: banner.button_link || '',
        start_date: banner.start_date ? banner.start_date.split('T')[0] : '',
        end_date: banner.end_date ? banner.end_date.split('T')[0] : '',
        is_active: banner.is_active,
      })
    } else {
      setEditingBanner(null)
      setFormData({
        title: '',
        subtitle: '',
        image_url: '',
        button_text: '',
        button_link: '',
        start_date: '',
        end_date: '',
        is_active: true,
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingBanner(null)
    setFormData({
      title: '',
      subtitle: '',
      image_url: '',
      button_text: '',
      button_link: '',
      start_date: '',
      end_date: '',
      is_active: true,
    })
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random()}.${fileExt}`
    const filePath = `banners/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('banner-images')
      .upload(filePath, file)

    if (uploadError) {
      alert('Error uploading image: ' + uploadError.message)
      setUploading(false)
      return
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('banner-images').getPublicUrl(filePath)

    setFormData({ ...formData, image_url: publicUrl })
    setUploading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const bannerData = {
        title: formData.title,
        subtitle: formData.subtitle || null,
        image_url: formData.image_url,
        button_text: formData.button_text || null,
        button_link: formData.button_link || null,
        start_date: formData.start_date ? new Date(formData.start_date).toISOString() : null,
        end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null,
        is_active: formData.is_active,
      }

      if (editingBanner) {
        const { error } = await supabase
          .from('banners')
          .update(bannerData)
          .eq('id', editingBanner.id)

        if (error) throw error

        setBanners(
          banners.map((b) => (b.id === editingBanner.id ? { ...b, ...bannerData } : b))
        )
      } else {
        const { data, error } = await supabase.from('banners').insert(bannerData).select()

        if (error) throw error

        setBanners([...(data as Banner[]), ...banners])
      }

      handleCloseModal()
    } catch (error: any) {
      alert('Error saving banner: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this banner?')) return

    const { error } = await supabase.from('banners').delete().eq('id', id)

    if (error) {
      alert('Error deleting banner: ' + error.message)
      return
    }

    setBanners(banners.filter((b) => b.id !== id))
  }

  const toggleActive = async (banner: Banner) => {
    const { error } = await supabase
      .from('banners')
      .update({ is_active: !banner.is_active })
      .eq('id', banner.id)

    if (error) {
      alert('Error updating banner: ' + error.message)
      return
    }

    setBanners(
      banners.map((b) => (b.id === banner.id ? { ...b, is_active: !b.is_active } : b))
    )
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-900">All Banners</h2>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition-all"
        >
          <Plus className="w-5 h-5" />
          <span>Add Banner</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {banners.map((banner) => (
          <div
            key={banner.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
          >
            <div className="relative h-48 bg-gray-100">
              {banner.image_url ? (
                <Image src={banner.image_url} alt={banner.title} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  No Image
                </div>
              )}
              <div className="absolute top-2 right-2">
                <span
                  className={`px-2 py-1 rounded text-xs font-semibold ${
                    banner.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {banner.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-1">{banner.title}</h3>
              {banner.subtitle && (
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">{banner.subtitle}</p>
              )}
              {(banner.start_date || banner.end_date) && (
                <div className="flex items-center space-x-1 text-xs text-gray-500 mb-3">
                  <Calendar className="w-3 h-3" />
                  <span>
                    {banner.start_date
                      ? new Date(banner.start_date).toLocaleDateString()
                      : 'No start'}
                    {' - '}
                    {banner.end_date
                      ? new Date(banner.end_date).toLocaleDateString()
                      : 'No end'}
                  </span>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleOpenModal(banner)}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
                >
                  <Edit className="w-4 h-4 inline mr-1" />
                  Edit
                </button>
                <button
                  onClick={() => toggleActive(banner)}
                  className={`flex-1 px-3 py-2 text-sm rounded-lg ${
                    banner.is_active
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {banner.is_active ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => handleDelete(banner.id)}
                  className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                {editingBanner ? 'Edit Banner' : 'Add Banner'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
                  <input
                    type="text"
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
                  {formData.image_url && (
                    <div className="relative w-full h-48 mb-2 rounded-lg overflow-hidden bg-gray-100">
                      <Image src={formData.image_url} alt="Banner preview" fill className="object-cover" />
                    </div>
                  )}
                  <label className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 w-fit">
                    <Upload className="w-5 h-5" />
                    <span>{uploading ? 'Uploading...' : 'Upload Image'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Button Text
                    </label>
                    <input
                      type="text"
                      value={formData.button_text}
                      onChange={(e) => setFormData({ ...formData, button_text: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Button Link
                    </label>
                    <input
                      type="text"
                      value={formData.button_link}
                      onChange={(e) => setFormData({ ...formData, button_link: e.target.value })}
                      placeholder="/products"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Active</span>
                  </label>
                </div>

                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !formData.image_url}
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : editingBanner ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

