'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Category } from '@/types/database'

interface Brand {
  id: string
  name: string
  category_id: string
  created_at?: string
  updated_at?: string
}

interface BrandManagementProps {
  initialBrands: Brand[]
  categories: Category[]
}

export default function BrandManagement({ initialBrands, categories }: BrandManagementProps) {
  const [brands, setBrands] = useState<Brand[]>(initialBrands)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
  })

  const supabase = createClient()

  const handleOpenModal = (brand?: Brand) => {
    if (brand) {
      setEditingBrand(brand)
      setFormData({
        name: brand.name,
        category_id: brand.category_id,
      })
    } else {
      setEditingBrand(null)
      setFormData({
        name: '',
        category_id: categories[0]?.id || '',
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingBrand(null)
    setFormData({
      name: '',
      category_id: '',
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const brandData = {
        name: formData.name,
        category_id: formData.category_id,
      }

      if (editingBrand) {
        const { error } = await supabase
          .from('brands')
          .update(brandData)
          .eq('id', editingBrand.id)

        if (error) throw error

        setBrands(
          brands.map((b) => (b.id === editingBrand.id ? { ...b, ...brandData } : b))
        )
      } else {
        const { data, error } = await supabase.from('brands').insert(brandData).select()

        if (error) throw error

        setBrands([...(data as Brand[]), ...brands])
      }

      handleCloseModal()
    } catch (error: any) {
      alert('Error saving brand: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this brand? Products with this brand will have their brand removed.')) return

    const { error } = await supabase.from('brands').delete().eq('id', id)

    if (error) {
      alert('Error deleting brand: ' + error.message)
      return
    }

    setBrands(brands.filter((b) => b.id !== id))
  }

  const getCategoryName = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.name || 'Unknown'
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-white">All Brands</h2>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-[#1e3a8a] to-[#3b82f6] text-white rounded-lg hover:shadow-lg hover:from-[#1e40af] hover:to-[#60a5fa] transition-all"
        >
          <Plus className="w-5 h-5" />
          <span>Add Brand</span>
        </button>
      </div>

      <div className="bg-gray-900 rounded-lg border border-white/10 overflow-hidden">
        <table className="min-w-full divide-y divide-white/10">
          <thead className="bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-gray-900 divide-y divide-white/10">
            {brands.map((brand) => (
              <tr key={brand.id} className="hover:bg-gray-800">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-white">{brand.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-400">{getCategoryName(brand.category_id)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      onClick={() => handleOpenModal(brand)}
                      className="text-[#3b82f6] hover:text-[#60a5fa] p-2 transition-colors"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(brand.id)}
                      className="text-red-400 hover:text-red-300 p-2"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg max-w-md w-full border border-white/10">
            <div className="p-6">
              <h3 className="text-2xl font-bold text-white mb-6">
                {editingBrand ? 'Edit Brand' : 'Add Brand'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Category</label>
                  <select
                    required
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Brand Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Samsung, iPhone, Infinix"
                  />
                </div>

                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 border border-white/10 rounded-lg text-gray-300 hover:bg-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-gradient-to-r from-[#1e3a8a] to-[#3b82f6] text-white rounded-lg hover:from-[#1e40af] hover:to-[#60a5fa] disabled:opacity-50 transition-all"
                  >
                    {loading ? 'Saving...' : editingBrand ? 'Update' : 'Create'}
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

