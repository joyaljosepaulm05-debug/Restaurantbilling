'use client'

import { useCartStore } from '@/store/cartStore'

interface CartSummaryProps {
  onCheckout: () => void
  onClear: () => void
  loading?: boolean
}

export function CartSummary({ onCheckout, onClear, loading }: CartSummaryProps) {
  const { subtotal, taxTotal, grandTotal, itemCount, items } = useCartStore()

  const hasItems = items.length > 0

  return (
    <div className="border-t border-gray-200 pt-4 space-y-3">

      {/* Totals */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Subtotal ({itemCount()} items)</span>
          <span>₹{subtotal().toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-500">
          <span>GST</span>
          <span>₹{taxTotal().toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-lg font-semibold
                        text-gray-900 pt-2 border-t border-gray-200">
          <span>Total</span>
          <span>₹{grandTotal().toFixed(2)}</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={onClear}
          disabled={!hasItems || loading}
          className="flex-1 py-2.5 rounded-xl border border-gray-300
                     text-sm font-medium text-gray-700
                     hover:bg-gray-50 disabled:opacity-40
                     disabled:cursor-not-allowed transition-colors"
        >
          Clear
        </button>
        <button
          onClick={onCheckout}
          disabled={!hasItems || loading}
          className="flex-2 px-6 py-2.5 rounded-xl bg-gray-900
                     text-white text-sm font-medium
                     hover:bg-gray-800 disabled:opacity-40
                     disabled:cursor-not-allowed transition-colors
                     flex-[2]"
        >
          {loading ? 'Processing...' : `Checkout ₹${grandTotal().toFixed(2)}`}
        </button>
      </div>

      {/* Keyboard shortcut hint */}
      <p className="text-xs text-center text-gray-400">
        Press <kbd className="border border-gray-200 rounded px-1">F12</kbd> to checkout
      </p>
    </div>
  )
}