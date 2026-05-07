'use client'

import { useState, useEffect } from 'react'
import { PLUInput }      from './PLUInput'
import { CartTable }     from './CartTable'
import { CartSummary }   from './CartSummary'
import { PaymentModal }  from './PaymentModal'
import { useCartStore }  from '@/store/cartStore'
import { useAuthStore }  from '@/store/authStore'
import { billingApi }    from '@/lib/api'

export function BillingScreen() {
  const { user }                        = useAuthStore()
  const { items, customerName, tableNumber,
          setCustomerName, setTableNumber,
          clearCart, grandTotal,
          branchId, setBranchId }        = useCartStore()

  const [isPaymentOpen,    setIsPaymentOpen]    = useState(false)
  const [currentSaleId,    setCurrentSaleId]    = useState<number | null>(null)
  const [checkoutLoading,  setCheckoutLoading]  = useState(false)
  const [successMessage,   setSuccessMessage]   = useState('')
  const [error,            setError]            = useState('')

  // Set branch from user on mount
  useEffect(() => {
    if (user?.branch_id) setBranchId(user.branch_id)
  }, [user, setBranchId])

  // F12 → checkout shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F12' && items.length > 0) {
        e.preventDefault()
        handleCheckout()
      }
      if (e.key === 'Escape' && isPaymentOpen) {
        setIsPaymentOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [items, isPaymentOpen])

  const handleCheckout = async () => {
    if (items.length === 0) return
    setError('')
    setCheckoutLoading(true)

    try {
      const payload: any = {
        items: items.map(i => ({
          short_code: i.short_code,
          quantity:   i.quantity,
        })),
        customer_name: customerName,
        table_number:  tableNumber,
        branch_id:     user?.branch_id ?? 1,
      }

      if (user?.role === 'OWNER' && branchId) {
        payload.branch_id = branchId
      }

      const response  = await billingApi.createSale(payload)
      const { sale }  = response.data
      setCurrentSaleId(sale.id)
      setIsPaymentOpen(true)

    } catch (err: any) {
      setError(
        err.response?.data?.error ||
        'Failed to create sale. Please try again.'
      )
    } finally {
      setCheckoutLoading(false)
    }
  }

  const handlePaymentSuccess = (billNumber: string) => {
    setIsPaymentOpen(false)
    setCurrentSaleId(null)
    setSuccessMessage(`✓ ${billNumber} — Payment successful!`)
    setTimeout(() => setSuccessMessage(''), 4000)
  }

  return (
    <div className="h-full bg-gray-50 flex flex-col">

      {/* ── Customer + table bar ──────────────────────────────── */}
      <div className="bg-white border-b border-gray-200
                      px-6 py-2 flex items-center gap-3
                      flex-shrink-0">
        <input
          type="text"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          placeholder="Customer name"
          className="border border-gray-300 rounded-lg px-3 py-1.5
                     text-sm w-40 focus:outline-none focus:ring-1
                     focus:ring-gray-900"
        />
        <input
          type="text"
          value={tableNumber}
          onChange={(e) => setTableNumber(e.target.value)}
          placeholder="Table no."
          className="border border-gray-300 rounded-lg px-3 py-1.5
                     text-sm w-28 focus:outline-none focus:ring-1
                     focus:ring-gray-900"
        />
        <span className="ml-auto text-xs text-gray-400">
          F12 to checkout
        </span>
      </div>

      {/* ── Main content ─────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left — Cart */}
        <div className="flex-1 flex flex-col p-6 overflow-hidden">

          <div className="mb-4">
            <PLUInput disabled={checkoutLoading} />
          </div>

          {successMessage && (
            <div className="mb-3 bg-green-50 border border-green-200
                            text-green-700 rounded-xl px-4 py-2.5
                            text-sm font-medium">
              {successMessage}
            </div>
          )}

          {error && (
            <div className="mb-3 bg-red-50 border border-red-200
                            text-red-700 rounded-xl px-4 py-2.5
                            text-sm">
              {error}
            </div>
          )}

          <div className="flex-1 bg-white rounded-2xl border
                          border-gray-200 flex flex-col
                          overflow-hidden p-4">
            <CartTable />
          </div>
        </div>

        {/* Right — Summary */}
        <div className="w-80 bg-white border-l border-gray-200
                        flex flex-col p-6">

          <h2 className="text-base font-semibold text-gray-900 mb-4">
            Order Summary
          </h2>

          {items.length > 0 && (
            <div className="flex flex-col gap-2 mb-4 flex-1
                            overflow-auto max-h-48">
              {items.map(item => (
                <div key={item.short_code}
                     className="flex justify-between text-sm">
                  <span className="text-gray-600 truncate">
                    {item.name} ×{item.quantity}
                  </span>
                  <span className="text-gray-900 font-medium
                                   ml-2 flex-shrink-0">
                    ₹{item.line_total.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {items.length === 0 && (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm text-gray-400 text-center">
                No items yet
              </p>
            </div>
          )}

          <CartSummary
            onCheckout={handleCheckout}
            onClear={clearCart}
            loading={checkoutLoading}
          />
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentOpen}
        saleId={currentSaleId}
        onClose={() => setIsPaymentOpen(false)}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  )
}