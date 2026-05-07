'use client'

import { useState }  from 'react'
import { Plus, RefreshCw } from 'lucide-react'
import { useMenuItems, useCategories } from '@/hooks/useInventory'
import { useAuthStore }   from '@/store/authStore'
import { MenuItemTable }  from './MenuItemTable'
import { MenuItemForm }   from './MenuItemForm'
import { StockModal }     from './StockModal'
import { MenuItem }       from '@/types'

export function InventoryDashboard() {
  const { user } = useAuthStore()

  const [selectedCategory, setSelectedCategory] = useState<number | undefined>()
  const [isFormOpen,   setIsFormOpen]   = useState(false)
  const [editingItem,  setEditingItem]  = useState<MenuItem | null>(null)
  const [stockItem,    setStockItem]    = useState<MenuItem | null>(null)

  const { data: items = [], isLoading,
          refetch, isFetching }       = useMenuItems(selectedCategory)
  const { data: categories = [] }     = useCategories()

  const canEdit = ['OWNER', 'MANAGER'].includes(user?.role ?? '')

  const handleEdit     = (item: MenuItem) => { setEditingItem(item); setIsFormOpen(true) }
  const handleAddNew   = ()               => { setEditingItem(null); setIsFormOpen(true) }
  const handleFormClose= ()               => { setIsFormOpen(false); setEditingItem(null) }

  return (
    <div className="bg-gray-50 min-h-full">

      {/* ── Action bar ──────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200
                      px-6 py-2 flex items-center
                      justify-between flex-shrink-0">
        <p className="text-xs text-gray-500">
          {items.length} items
        </p>

        <div className="flex items-center gap-2">
          {/* Refresh */}
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="text-gray-400 hover:text-gray-600 p-1.5
                       rounded-lg hover:bg-gray-100 disabled:opacity-40"
          >
            <RefreshCw
              size={14}
              className={isFetching ? 'animate-spin' : ''}
            />
          </button>

          {/* Add item */}
          {canEdit && (
            <button
              onClick={handleAddNew}
              className="flex items-center gap-1.5 bg-gray-900
                         text-white text-xs font-medium px-3 py-1.5
                         rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Plus size={13} />
              Add item
            </button>
          )}
        </div>
      </div>

      {/* ── Main ────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-6 py-6">

        {/* Category filter tabs */}
        <div className="flex items-center gap-2 mb-6
                        overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedCategory(undefined)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm
                        font-medium transition-colors
              ${!selectedCategory
                ? 'bg-gray-900 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
          >
            All items
          </button>

          {categories.map((cat: any) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(
                selectedCategory === cat.id ? undefined : cat.id
              )}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm
                          font-medium transition-colors
                ${selectedCategory === cat.id
                  ? 'bg-gray-900 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
            >
              {cat.icon} {cat.name}
              <span className="ml-1.5 text-xs opacity-60">
                {cat.item_count}
              </span>
            </button>
          ))}
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-gray-900
                            border-t-transparent rounded-full
                            animate-spin" />
          </div>
        ) : (
          <MenuItemTable
            items={items}
            onEdit={handleEdit}
            onAddStock={(item) => setStockItem(item)}
            canEdit={canEdit}
          />
        )}
      </main>

      {/* Modals */}
      <MenuItemForm
        isOpen={isFormOpen}
        item={editingItem}
        onClose={handleFormClose}
      />
      <StockModal
        isOpen={!!stockItem}
        item={stockItem}
        onClose={() => setStockItem(null)}
      />
    </div>
  )
}