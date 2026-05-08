'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useCategories, useCreateMenuItem,
         useUpdateMenuItem } from '@/hooks/useInventory'
import { inventoryApi } from '@/lib/api'
import { MenuItem } from '@/types'

interface MenuItemFormProps {
  isOpen: boolean
  item?: MenuItem | null
  onClose: () => void
}

export function MenuItemForm({ isOpen, item, onClose }: MenuItemFormProps) {
  const isEditing   = !!item
  const queryClient = useQueryClient()

  const { data: categories = [] } = useCategories()
  const createItem                = useCreateMenuItem()
  const updateItem                = useUpdateMenuItem()

  const [form, setForm] = useState({
    name:         '',
    short_code:   '',
    category:     '',
    base_price:   '',
    tax_percent:  '5',
    item_type:    'FOOD',
    description:  '',
    tags:         '',
    is_available: true,
  })
  const [error, setError] = useState('')

  useEffect(() => {
    if (item) {
      setForm({
        name:         item.name,
        short_code:   item.short_code,
        category:     String(item.category),
        base_price:   item.base_price,
        tax_percent:  item.tax_percent,
        item_type:    (item as any).item_type || 'FOOD',
        description:  (item as any).description || '',
        tags:         (item.tags || []).join(', '),
        is_available: item.is_available,
      })
    } else {
      setForm({
        name: '', short_code: '', category: '',
        base_price: '', tax_percent: '5',
        item_type: 'FOOD', description: '',
        tags: '', is_available: true,
      })
    }
    setError('')
  }, [item, isOpen])

  const handleCreateCategory = async () => {
    const name = prompt('Category name?')
    if (!name?.trim()) return
    const icon = prompt('Emoji icon? (optional, e.g. 🍚)') || ''
    try {
      await inventoryApi.createCategory({
        name: name.trim(), icon, sort_order: 0
      })
      queryClient.invalidateQueries({ queryKey: ['inventory', 'categories'] })
    } catch {
      alert('Failed to create category.')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const payload = {
      name:         form.name.trim(),
      short_code:   form.short_code.trim().toUpperCase(),
      category:     parseInt(form.category),
      base_price:   form.base_price,
      tax_percent:  form.tax_percent,
      item_type:    form.item_type,
      description:  form.description,
      tags:         form.tags.split(',').map(t => t.trim()).filter(Boolean),
      is_available: form.is_available,
    }

    try {
      if (isEditing && item) {
        await updateItem.mutateAsync({ id: item.id, data: payload })
      } else {
        await createItem.mutateAsync(payload)
      }
      onClose()
    } catch (err: any) {
      setError(
        err.response?.data?.short_code?.[0] ||
        err.response?.data?.name?.[0]       ||
        err.response?.data?.detail          ||
        'Failed to save item.'
      )
    }
  }

  if (!isOpen) return null

  const isLoading = createItem.isPending || updateItem.isPending

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center
                    justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl
                      overflow-hidden max-h-[90vh] flex flex-col">

        {/* ── Header ─────────────────────────────────────────── */}
        <div className="flex items-center justify-between p-5
                        border-b border-gray-200 flex-shrink-0">
          <h2 className="text-base font-semibold text-gray-900">
            {isEditing ? 'Edit menu item' : 'Add menu item'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600
                       p-1 rounded-lg hover:bg-gray-100"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Form ───────────────────────────────────────────── */}
        <form
          onSubmit={handleSubmit}
          className="p-5 space-y-4 overflow-y-auto flex-1"
        >

          {/* Name + PLU */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium
                                text-gray-700 mb-1">
                Item name *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(f => ({
                  ...f, name: e.target.value
                }))}
                required
                placeholder="Chicken Biryani"
                className="w-full border border-gray-300 rounded-lg
                           px-3 py-2 text-sm focus:outline-none
                           focus:ring-2 focus:ring-gray-900"
              />
            </div>
            <div>
              <label className="block text-xs font-medium
                                text-gray-700 mb-1">
                PLU code *
              </label>
              <input
                type="text"
                value={form.short_code}
                onChange={e => setForm(f => ({
                  ...f, short_code: e.target.value.toUpperCase()
                }))}
                required
                maxLength={10}
                placeholder="CB1"
                className="w-full border border-gray-300 rounded-lg
                           px-3 py-2 text-sm font-mono uppercase
                           focus:outline-none focus:ring-2
                           focus:ring-gray-900"
              />
              <p className="text-xs text-gray-400 mt-0.5">
                Max 10 chars. Staff type this at billing.
              </p>
            </div>
          </div>

          {/* Category + Type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-gray-700">
                  Category *
                </label>
                <button
                  type="button"
                  onClick={handleCreateCategory}
                  className="text-xs text-blue-600 hover:underline"
                >
                  + New category
                </button>
              </div>
              <select
                value={form.category}
                onChange={e => setForm(f => ({
                  ...f, category: e.target.value
                }))}
                required
                className="w-full border border-gray-300 rounded-lg
                           px-3 py-2 text-sm focus:outline-none
                           focus:ring-2 focus:ring-gray-900 bg-white"
              >
                <option value="">Select category</option>
                {categories.map((cat: any) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium
                                text-gray-700 mb-1">
                Item type
              </label>
              <select
                value={form.item_type}
                onChange={e => setForm(f => ({
                  ...f, item_type: e.target.value
                }))}
                className="w-full border border-gray-300 rounded-lg
                           px-3 py-2 text-sm focus:outline-none
                           focus:ring-2 focus:ring-gray-900 bg-white"
              >
                <option value="FOOD">Food</option>
                <option value="BEVERAGE">Beverage</option>
                <option value="COMBO">Combo Meal</option>
                <option value="ADD_ON">Add-on / Extra</option>
              </select>
            </div>
          </div>

          {/* Price + Tax */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium
                                text-gray-700 mb-1">
                Base price (₹) *
              </label>
              <input
                type="number"
                value={form.base_price}
                onChange={e => setForm(f => ({
                  ...f, base_price: e.target.value
                }))}
                required
                min="0.01"
                step="0.01"
                placeholder="180.00"
                className="w-full border border-gray-300 rounded-lg
                           px-3 py-2 text-sm focus:outline-none
                           focus:ring-2 focus:ring-gray-900"
              />
            </div>
            <div>
              <label className="block text-xs font-medium
                                text-gray-700 mb-1">
                GST (%)
              </label>
              <select
                value={form.tax_percent}
                onChange={e => setForm(f => ({
                  ...f, tax_percent: e.target.value
                }))}
                className="w-full border border-gray-300 rounded-lg
                           px-3 py-2 text-sm focus:outline-none
                           focus:ring-2 focus:ring-gray-900 bg-white"
              >
                <option value="0">0% (Exempt)</option>
                <option value="5">5% (Restaurant)</option>
                <option value="12">12%</option>
                <option value="18">18%</option>
                <option value="28">28%</option>
              </select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-medium
                              text-gray-700 mb-1">
              Tags (comma separated)
            </label>
            <input
              type="text"
              value={form.tags}
              onChange={e => setForm(f => ({
                ...f, tags: e.target.value
              }))}
              placeholder="veg, spicy, bestseller"
              className="w-full border border-gray-300 rounded-lg
                         px-3 py-2 text-sm focus:outline-none
                         focus:ring-2 focus:ring-gray-900"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium
                              text-gray-700 mb-1">
              Description (optional)
            </label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({
                ...f, description: e.target.value
              }))}
              rows={2}
              placeholder="Brief description..."
              className="w-full border border-gray-300 rounded-lg
                         px-3 py-2 text-sm focus:outline-none
                         focus:ring-2 focus:ring-gray-900 resize-none"
            />
          </div>

          {/* Availability toggle */}
          <div className="flex items-center justify-between
                          py-3 px-4 bg-gray-50 rounded-xl">
            <div>
              <p className="text-sm font-medium text-gray-900">
                Available today
              </p>
              <p className="text-xs text-gray-500">
                Toggle off to hide from billing screen
              </p>
            </div>
            <button
              type="button"
              onClick={() => setForm(f => ({
                ...f, is_available: !f.is_available
              }))}
              className={`relative w-11 h-6 rounded-full
                          transition-colors
                ${form.is_available ? 'bg-gray-900' : 'bg-gray-300'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white
                               rounded-full transition-transform
                               shadow-sm
                ${form.is_available
                  ? 'translate-x-6'
                  : 'translate-x-1'}`}
              />
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200
                            text-red-700 rounded-xl p-3 text-sm">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gray-900 text-white rounded-xl
                       py-3 text-sm font-medium hover:bg-gray-800
                       disabled:opacity-40 transition-colors"
          >
            {isLoading
              ? 'Saving...'
              : isEditing ? 'Update item' : 'Add item'
            }
          </button>
        </form>
      </div>
    </div>
  )
}