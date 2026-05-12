'use client'

import { useState, useEffect }  from 'react'
import { useTabsStore }         from '@/store/tabsStore'
import { useKeyboard }          from '@/hooks/useKeyboard'
import { Trash2 }               from 'lucide-react'

interface CartTableProps {
  pluInputRef?: React.RefObject<HTMLInputElement>
}

export function CartTable({ pluInputRef }: CartTableProps) {
  const { activeTab, updateQuantity, removeItem } = useTabsStore()
  const tab   = activeTab()
  const items = tab.items

  const [selectedIndex, setSelectedIndex] = useState<number>(-1)

  useEffect(() => {
    if (selectedIndex >= items.length) setSelectedIndex(items.length - 1)
  }, [items.length])

  useEffect(() => {
    if (items.length === 0) {
      setSelectedIndex(-1)
      pluInputRef?.current?.focus()
    }
  }, [items.length])

  // Reset selection when tab changes
  useEffect(() => {
    setSelectedIndex(-1)
  }, [tab.id])

  const sel = selectedIndex >= 0 ? items[selectedIndex] : null

  useKeyboard({
    'ArrowUp': (e) => {
      if (!items.length) return
      e.preventDefault()
      setSelectedIndex(i => Math.max(0, i - 1))
    },
    'ArrowDown': (e) => {
      if (!items.length) return
      e.preventDefault()
      setSelectedIndex(i => i === -1 ? 0 : Math.min(items.length - 1, i + 1))
    },
    '+': (e) => { if (!sel) return; e.preventDefault(); updateQuantity(sel.short_code, sel.quantity + 1) },
    '=': (e) => { if (!sel) return; e.preventDefault(); updateQuantity(sel.short_code, sel.quantity + 1) },
    '-': (e) => { if (!sel) return; e.preventDefault(); updateQuantity(sel.short_code, sel.quantity - 1) },
    '_': (e) => { if (!sel) return; e.preventDefault(); updateQuantity(sel.short_code, sel.quantity - 1) },
    'Delete': (e) => { if (!sel) return; e.preventDefault(); removeItem(sel.short_code) },
    'Escape': () => {
      if (selectedIndex >= 0) {
        setSelectedIndex(-1)
        pluInputRef?.current?.focus()
      }
    },
  }, [sel, selectedIndex, items])

  if (items.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center
                      justify-center text-gray-400 py-16">
        <div className="w-14 h-14 rounded-2xl bg-gray-100
                        flex items-center justify-center mb-3">
          <span className="text-2xl">🛒</span>
        </div>
        <p className="text-sm font-medium">Cart is empty</p>
        <p className="text-xs mt-1">Type PLU code → Enter</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Selection hint bar */}
      {selectedIndex >= 0 && sel && (
        <div className="px-4 py-1.5 bg-gray-900 text-white text-xs
                        flex items-center gap-4 flex-shrink-0">
          <span className="font-medium">{sel.name}</span>
          <span className="text-gray-400 ml-auto flex items-center gap-2">
            <kbd className="bg-gray-700 px-1.5 py-0.5 rounded">+</kbd>
            <kbd className="bg-gray-700 px-1.5 py-0.5 rounded">-</kbd>
            qty ·
            <kbd className="bg-gray-700 px-1.5 py-0.5 rounded">Del</kbd>
            remove ·
            <kbd className="bg-gray-700 px-1.5 py-0.5 rounded">Esc</kbd>
            deselect
          </span>
        </div>
      )}

      {/* Table */}
      <div className="overflow-auto flex-1">
        <table className="w-full">
          <thead className="sticky top-0 bg-white z-10">
            <tr className="border-b border-gray-200">
              {['Item','Qty','Price','Tax','Total'].map(h => (
                <th key={h}
                    className="text-left text-xs font-medium
                               text-gray-500 uppercase tracking-wider
                               px-4 py-2.5">
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-50">
            {items.map((item, index) => {
              const isSel = index === selectedIndex
              return (
                <tr
                  key={item.short_code}
                  onClick={() =>
                    setSelectedIndex(isSel ? -1 : index)
                  }
                  className={`cursor-pointer transition-colors select-none
                    ${isSel
                      ? 'bg-gray-900 text-white'
                      : 'hover:bg-gray-50 text-gray-900'
                    }`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`
                        px-1.5 py-0.5 rounded text-xs font-mono
                        font-semibold flex-shrink-0
                        ${isSel
                          ? 'bg-white/20 text-white'
                          : 'bg-gray-100 text-gray-700'
                        }
                      `}>
                        {item.short_code}
                      </span>
                      <span className="text-sm font-medium">
                        {item.name}
                      </span>
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={e => {
                          e.stopPropagation()
                          updateQuantity(item.short_code, item.quantity - 1)
                        }}
                        className={`w-6 h-6 rounded-full border flex
                                    items-center justify-center text-sm
                                    transition-colors
                          ${isSel
                            ? 'border-white/40 text-white hover:bg-white/20'
                            : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                          }`}
                      >−</button>
                      <span className="text-sm font-semibold w-6
                                       text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={e => {
                          e.stopPropagation()
                          updateQuantity(item.short_code, item.quantity + 1)
                        }}
                        className={`w-6 h-6 rounded-full border flex
                                    items-center justify-center text-sm
                                    transition-colors
                          ${isSel
                            ? 'border-white/40 text-white hover:bg-white/20'
                            : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                          }`}
                      >+</button>
                    </div>
                  </td>

                  <td className={`px-4 py-3 text-sm
                    ${isSel ? 'text-white/80' : 'text-gray-600'}`}>
                    ₹{item.unit_price.toFixed(2)}
                  </td>

                  <td className={`px-4 py-3 text-sm
                    ${isSel ? 'text-white/70' : 'text-gray-500'}`}>
                    ₹{item.tax_amount.toFixed(2)}
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">
                        ₹{item.line_total.toFixed(2)}
                      </span>
                      <button
                        onClick={e => {
                          e.stopPropagation()
                          removeItem(item.short_code)
                        }}
                        className={`p-1 rounded transition-all
                          ${isSel
                            ? 'text-white/60 hover:bg-white/20'
                            : 'text-gray-300 hover:text-red-500 hover:bg-red-50'
                          }`}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Bottom hint */}
      <div className="px-4 py-2 border-t border-gray-100 bg-gray-50
                      flex-shrink-0">
        <p className="text-xs text-gray-400">
          <kbd className="bg-white border border-gray-300 px-1
                           rounded text-gray-500">↑↓</kbd> select ·
          <kbd className="bg-white border border-gray-300 px-1
                           rounded text-gray-500 mx-1">+</kbd>
          <kbd className="bg-white border border-gray-300 px-1
                           rounded text-gray-500">-</kbd> qty ·
          <kbd className="bg-white border border-gray-300 px-1
                           rounded text-gray-500 mx-1">Del</kbd>
          remove · click row to select
        </p>
      </div>
    </div>
  )
}