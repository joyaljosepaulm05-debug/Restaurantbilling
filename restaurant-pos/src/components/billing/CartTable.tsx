'use client'

import { useCartStore } from '@/store/cartStore'
import { Minus, Plus, Trash2 } from 'lucide-react'

export function CartTable() {
  const { items, updateQuantity, removeItem } = useCartStore()

  if (items.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center
                      text-gray-400 py-20">
        <div className="w-16 h-16 rounded-2xl bg-gray-100
                        flex items-center justify-center mb-4">
          <span className="text-3xl">🛒</span>
        </div>
        <p className="text-base font-medium">Cart is empty</p>
        <p className="text-sm mt-1">
          Type a PLU code above and press Enter
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left text-xs font-medium text-gray-500
                           uppercase tracking-wider py-3 px-2">
              Item
            </th>
            <th className="text-center text-xs font-medium text-gray-500
                           uppercase tracking-wider py-3 px-2">
              Qty
            </th>
            <th className="text-right text-xs font-medium text-gray-500
                           uppercase tracking-wider py-3 px-2">
              Price
            </th>
            <th className="text-right text-xs font-medium text-gray-500
                           uppercase tracking-wider py-3 px-2">
              Tax
            </th>
            <th className="text-right text-xs font-medium text-gray-500
                           uppercase tracking-wider py-3 px-2">
              Total
            </th>
            <th className="py-3 px-2 w-8"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {items.map((item, index) => (
            <tr
              key={item.short_code}
              className="hover:bg-gray-50 transition-colors group"
            >
              {/* Item name + code */}
              <td className="py-3 px-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2 py-0.5
                                   bg-gray-100 text-gray-600 rounded
                                   text-xs font-mono font-medium">
                    {item.short_code}
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {item.name}
                  </span>
                </div>
              </td>

              {/* Quantity controls */}
              <td className="py-3 px-2">
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => updateQuantity(
                      item.short_code, item.quantity - 1
                    )}
                    className="w-6 h-6 rounded-full border border-gray-300
                               flex items-center justify-center
                               hover:bg-gray-100 transition-colors"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="text-sm font-medium w-8 text-center">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(
                      item.short_code, item.quantity + 1
                    )}
                    className="w-6 h-6 rounded-full border border-gray-300
                               flex items-center justify-center
                               hover:bg-gray-100 transition-colors"
                  >
                    <Plus size={12} />
                  </button>
                </div>
              </td>

              {/* Price */}
              <td className="py-3 px-2 text-right text-sm text-gray-700">
                ₹{item.unit_price.toFixed(2)}
              </td>

              {/* Tax */}
              <td className="py-3 px-2 text-right text-sm text-gray-500">
                ₹{item.tax_amount.toFixed(2)}
              </td>

              {/* Line total */}
              <td className="py-3 px-2 text-right text-sm
                             font-medium text-gray-900">
                ₹{item.line_total.toFixed(2)}
              </td>

              {/* Remove button */}
              <td className="py-3 px-2">
                <button
                  onClick={() => removeItem(item.short_code)}
                  className="opacity-0 group-hover:opacity-100
                             text-red-400 hover:text-red-600
                             transition-all p-1 rounded"
                >
                  <Trash2 size={14} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}