'use client'

import { useState } from 'react'
import { Edit2, Package, ToggleLeft,
         ToggleRight, Trash2, Search } from 'lucide-react'
import { CategoryBadge } from './CategoryBadge'
import { useToggleAvailability } from '@/hooks/useInventory'
import { MenuItem } from '@/types'

interface MenuItemTableProps {
  items: MenuItem[]
  onEdit: (item: MenuItem) => void
  onAddStock: (item: MenuItem) => void
  canEdit: boolean
}

export function MenuItemTable({
  items, onEdit, onAddStock, canEdit
}: MenuItemTableProps) {
  const [search, setSearch] = useState('')
  const toggleAvailability  = useToggleAvailability()

  const filtered = items.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.short_code.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      {/* Search bar */}
      <div className="relative mb-4">
        <Search size={15} className="absolute left-3 top-1/2
                                      -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or PLU code..."
          className="w-full pl-9 pr-4 py-2.5 border border-gray-300
                     rounded-xl text-sm focus:outline-none
                     focus:ring-2 focus:ring-gray-900 bg-white"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200
                      overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {['PLU', 'Name', 'Category', 'Price', 'Tax',
                'Available', 'Actions'].map(h => (
                <th key={h}
                    className="text-left text-xs font-medium
                               text-gray-500 uppercase tracking-wider
                               px-4 py-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {filtered.map((item) => (
              <tr key={item.id}
                  className="hover:bg-gray-50 transition-colors group">

                {/* PLU code */}
                <td className="px-4 py-3">
                  <code className="text-xs font-mono font-semibold
                                   bg-gray-900 text-white px-2 py-1
                                   rounded">
                    {item.short_code}
                  </code>
                </td>

                {/* Name */}
                <td className="px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {item.name}
                    </p>
                    {item.tags?.length > 0 && (
                      <div className="flex gap-1 mt-0.5 flex-wrap">
                        {item.tags.slice(0, 3).map(tag => (
                          <span key={tag}
                                className="text-xs text-gray-400">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </td>

                {/* Category */}
                <td className="px-4 py-3">
                  <CategoryBadge name={item.category_name} />
                </td>

                {/* Price */}
                <td className="px-4 py-3">
                  <span className="text-sm font-medium text-gray-900">
                    ₹{parseFloat(item.base_price).toFixed(2)}
                  </span>
                </td>

                {/* Tax */}
                <td className="px-4 py-3">
                  <span className="text-sm text-gray-600">
                    {parseFloat(item.tax_percent).toFixed(0)}%
                  </span>
                </td>

                {/* Availability toggle */}
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleAvailability.mutate({
                      id: item.id,
                      isAvailable: !item.is_available
                    })}
                    disabled={!canEdit}
                    className="disabled:opacity-40
                               disabled:cursor-not-allowed"
                    title={item.is_available
                      ? 'Click to mark unavailable'
                      : 'Click to mark available'}
                  >
                    {item.is_available
                      ? <ToggleRight size={22}
                                     className="text-green-500" />
                      : <ToggleLeft size={22}
                                    className="text-gray-400" />
                    }
                  </button>
                </td>

                {/* Actions */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1
                                  opacity-0 group-hover:opacity-100
                                  transition-opacity">
                    {/* Add stock */}
                    <button
                      onClick={() => onAddStock(item)}
                      className="p-1.5 rounded-lg hover:bg-blue-50
                                 text-blue-500 hover:text-blue-700
                                 transition-colors"
                      title="Add stock"
                    >
                      <Package size={14} />
                    </button>

                    {/* Edit */}
                    {canEdit && (
                      <button
                        onClick={() => onEdit(item)}
                        className="p-1.5 rounded-lg hover:bg-gray-100
                                   text-gray-500 hover:text-gray-700
                                   transition-colors"
                        title="Edit item"
                      >
                        <Edit2 size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={7}
                    className="px-4 py-12 text-center text-sm
                               text-gray-400">
                  {search
                    ? `No items matching "${search}"`
                    : 'No menu items yet. Add your first item.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400 mt-2 text-right">
        {filtered.length} of {items.length} items
      </p>
    </div>
  )
}