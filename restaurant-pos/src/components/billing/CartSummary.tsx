'use client'

import { useTabsStore } from '@/store/tabsStore'

interface CartSummaryProps {
  onCheckout: () => void
  onClear:    () => void
  loading?:   boolean
}

export function CartSummary({
  onCheckout, onClear, loading
}: CartSummaryProps) {
  const { subtotal, taxTotal, grandTotal, itemCount, activeTab } = useTabsStore()
  const tab      = activeTab()
  const hasItems = tab.items.length > 0

  return (
    <div className="border-t border-gray-200 pt-4 space-y-3
                    flex-shrink-0">

      <div className="space-y-1.5">
        <div className="flex justify-between text-sm text-gray-500">
          <span>Subtotal ({itemCount()} items)</span>
          <span>₹{subtotal().toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-400">
          <span>GST</span>
          <span>₹{taxTotal().toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-base font-semibold
                        text-gray-900 pt-2 border-t border-gray-200">
          <span>Total</span>
          <span>₹{grandTotal().toFixed(2)}</span>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onClear}
          disabled={!hasItems || loading}
          className="flex-1 py-2.5 rounded-xl border border-gray-300
                     text-sm font-medium text-gray-700 hover:bg-gray-50
                     disabled:opacity-40 disabled:cursor-not-allowed
                     transition-colors"
        >
          Clear
        </button>
        <button
          onClick={onCheckout}
          disabled={!hasItems || loading}
          className="flex-[2] py-2.5 rounded-xl bg-gray-900 text-white
                     text-sm font-medium hover:bg-gray-800
                     disabled:opacity-40 disabled:cursor-not-allowed
                     transition-colors flex items-center
                     justify-center gap-2"
        >
          {loading ? 'Processing...' : (
            <>
              Checkout ₹{grandTotal().toFixed(2)}
              <kbd className="bg-white/20 px-1.5 py-0.5 rounded
                              text-xs font-mono">F12</kbd>
            </>
          )}
        </button>
      </div>

      <p className="text-xs text-center text-gray-400">
        <kbd className="border border-gray-200 rounded px-1
                        bg-gray-50">Ctrl+T</kbd> new tab ·
        <kbd className="border border-gray-200 rounded px-1
                        bg-gray-50 mx-1">Ctrl+W</kbd> close tab ·
        <kbd className="border border-gray-200 rounded px-1
                        bg-gray-50">Ctrl+1-9</kbd> switch
      </p>
    </div>
  )
}