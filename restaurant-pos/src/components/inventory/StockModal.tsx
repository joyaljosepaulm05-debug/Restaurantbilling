'use client'

import { useState } from 'react'
import { X, Package, TrendingUp } from 'lucide-react'
import { useAddStock, useStockLevel } from '@/hooks/useInventory'
import { MenuItem } from '@/types'

interface StockModalProps {
  isOpen: boolean
  item: MenuItem | null
  onClose: () => void
}

export function StockModal({ isOpen, item, onClose }: StockModalProps) {
  const [quantity, setQuantity] = useState('')
  const [note, setNote]         = useState('')
  const [error, setError]       = useState('')

  const addStock    = useAddStock()
  const { data: currentStock = 0 } = useStockLevel(item?.id ?? 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!item) return
    setError('')

    const qty = parseInt(quantity)
    if (!qty || qty <= 0) {
      setError('Quantity must be a positive number.')
      return
    }

    try {
      await addStock.mutateAsync({
        menuItemId: item.id,
        quantity: qty,
        note,
      })
      setQuantity('')
      setNote('')
      onClose()
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
        'Failed to add stock.'
      )
    }
  }

  if (!isOpen || !item) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center
                    justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl">

        {/* Header */}
        <div className="flex items-center justify-between p-5
                        border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-50 rounded-lg
                            flex items-center justify-center">
              <Package size={16} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">
                Add stock
              </h2>
              <p className="text-xs text-gray-500">
                {item.short_code} — {item.name}
              </p>
            </div>
          </div>
          <button onClick={onClose}
                  className="text-gray-400 hover:text-gray-600
                             p-1 rounded-lg hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">

          {/* Current stock display */}
          <div className="flex items-center justify-between
                          bg-gray-50 rounded-xl p-4">
            <div>
              <p className="text-xs text-gray-500">Current stock</p>
              <p className="text-2xl font-semibold text-gray-900">
                {currentStock}
              </p>
            </div>
            <TrendingUp size={20}
                        className={currentStock > 10
                          ? 'text-green-500'
                          : 'text-amber-500'} />
          </div>

          {/* Quantity input */}
          <div>
            <label className="block text-xs font-medium
                              text-gray-700 mb-1">
              Quantity to add *
            </label>
            <input
              type="number"
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
              min="1"
              required
              autoFocus
              placeholder="e.g. 50"
              className="w-full border border-gray-300 rounded-xl
                         px-4 py-2.5 text-lg font-mono
                         focus:outline-none focus:ring-2
                         focus:ring-gray-900"
            />
            {quantity && parseInt(quantity) > 0 && (
              <p className="text-xs text-green-600 mt-1">
                New stock level will be{' '}
                <strong>{currentStock + parseInt(quantity)}</strong>
              </p>
            )}
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-medium
                              text-gray-700 mb-1">
              Note (optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="e.g. Morning delivery from supplier"
              className="w-full border border-gray-300 rounded-xl
                         px-3 py-2 text-sm focus:outline-none
                         focus:ring-2 focus:ring-gray-900"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200
                            text-red-700 rounded-xl p-3 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={addStock.isPending}
            className="w-full bg-gray-900 text-white rounded-xl
                       py-3 text-sm font-medium hover:bg-gray-800
                       disabled:opacity-40 transition-colors"
          >
            {addStock.isPending
              ? 'Adding...'
              : `Add ${quantity || '0'} units`}
          </button>
        </form>
      </div>
    </div>
  )
}