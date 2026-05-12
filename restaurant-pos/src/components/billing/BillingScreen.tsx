'use client'

import { useState, useEffect,
         useRef, useCallback }  from 'react'
import { BillingTabs }          from './BillingTabs'
import { PLUInput }             from './PLUInput'
import { CartTable }            from './CartTable'
import { CartSummary }          from './CartSummary'
import { PaymentModal }         from './PaymentModal'
import { useTabsStore }         from '@/store/tabsStore'
import { useAuthStore }         from '@/store/authStore'
import { useKeyboard }          from '@/hooks/useKeyboard'
import { billingApi }           from '@/lib/api'

export function BillingScreen() {
  const { user }                       = useAuthStore()
  const store                          = useTabsStore()
  const tab                            = store.activeTab()

  const [isPaymentOpen,   setIsPaymentOpen]   = useState(false)
  const [currentSaleId,   setCurrentSaleId]   = useState<number | null>(null)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [successMsg,      setSuccessMsg]      = useState('')
  const [error,           setError]           = useState('')

  const pluRef      = useRef<HTMLInputElement>(null)
  const customerRef = useRef<HTMLInputElement>(null)
  const tableRef    = useRef<HTMLInputElement>(null)

  // Refocus PLU when tab changes
  useEffect(() => {
    setError('')
    setTimeout(() => pluRef.current?.focus(), 50)
  }, [tab.id])

  // ── Checkout ─────────────────────────────────────────────────
  const handleCheckout = useCallback(async () => {
    if (tab.items.length === 0 || checkoutLoading) return
    setError('')
    setCheckoutLoading(true)

    try {
      const payload: any = {
        items: tab.items.map(i => ({
          short_code: i.short_code,
          quantity:   i.quantity,
        })),
        customer_name: tab.customerName,
        table_number:  tab.tableNumber,
        branch_id:     user?.branch_id ?? 1,
      }
      if (user?.role === 'OWNER' && user?.branch_id) {
        payload.branch_id = user.branch_id
      }

      const res    = await billingApi.createSale(payload)
      const { sale } = res.data
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
  }, [tab, user, checkoutLoading])

  const handlePaymentSuccess = (billNumber: string) => {
    setIsPaymentOpen(false)
    setCurrentSaleId(null)
    store.clearCart()
    setSuccessMsg(`✓ ${billNumber} paid`)
    setTimeout(() => setSuccessMsg(''), 3000)
    setTimeout(() => pluRef.current?.focus(), 100)
  }

  const handleModalClose = () => {
    setIsPaymentOpen(false)
    setTimeout(() => pluRef.current?.focus(), 100)
  }

  // ── Global keyboard shortcuts ─────────────────────────────────
  useKeyboard({
    // F12 → checkout
    'F12': (e) => {
      e.preventDefault()
      if (!isPaymentOpen && tab.items.length > 0) handleCheckout()
    },
    // F2 → customer name
    'F2': (e) => {
      e.preventDefault()
      customerRef.current?.focus()
      customerRef.current?.select()
    },
    // F3 → table number
    'F3': (e) => {
      e.preventDefault()
      tableRef.current?.focus()
      tableRef.current?.select()
    },
    // Ctrl+T → new tab
    't': (e) => {
      if (!e.ctrlKey && !e.metaKey) return
      e.preventDefault()
      store.addTab()
      setTimeout(() => pluRef.current?.focus(), 50)
    },
    // Ctrl+W → close tab
    'w': (e) => {
      if (!e.ctrlKey && !e.metaKey) return
      e.preventDefault()
      store.closeTab(tab.id)
      setTimeout(() => pluRef.current?.focus(), 50)
    },
    // Ctrl+Tab → next tab
    'Tab': (e) => {
      if (!e.ctrlKey) return
      e.preventDefault()
      if (e.shiftKey) store.prevTab()
      else            store.nextTab()
      setTimeout(() => pluRef.current?.focus(), 50)
    },
    // Ctrl+1..9 → go to tab
    '1': (e) => { if (e.ctrlKey || e.metaKey) { e.preventDefault(); store.goToTabIndex(0) } },
    '2': (e) => { if (e.ctrlKey || e.metaKey) { e.preventDefault(); store.goToTabIndex(1) } },
    '3': (e) => { if (e.ctrlKey || e.metaKey) { e.preventDefault(); store.goToTabIndex(2) } },
    '4': (e) => { if (e.ctrlKey || e.metaKey) { e.preventDefault(); store.goToTabIndex(3) } },
    '5': (e) => { if (e.ctrlKey || e.metaKey) { e.preventDefault(); store.goToTabIndex(4) } },
    '6': (e) => { if (e.ctrlKey || e.metaKey) { e.preventDefault(); store.goToTabIndex(5) } },
    '7': (e) => { if (e.ctrlKey || e.metaKey) { e.preventDefault(); store.goToTabIndex(6) } },
    '8': (e) => { if (e.ctrlKey || e.metaKey) { e.preventDefault(); store.goToTabIndex(7) } },
    '9': (e) => { if (e.ctrlKey || e.metaKey) { e.preventDefault(); store.goToTabIndex(8) } },
    // Esc → close modal or clear
    'Escape': () => { if (isPaymentOpen) handleModalClose() },
  }, [tab, isPaymentOpen, handleCheckout, store])

  return (
    <div className="h-full bg-gray-50 flex flex-col overflow-hidden">

      {/* ── Multi-tab bar ─────────────────────────────────────── */}
      <BillingTabs />

      {/* ── Customer + table bar ─────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 px-4 py-2
                      flex items-center gap-3 flex-shrink-0">

        <div className="flex items-center gap-1.5">
          <kbd className="text-xs bg-gray-100 text-gray-500 border
                          border-gray-300 px-1.5 py-0.5 rounded
                          font-mono leading-none flex-shrink-0">
            F2
          </kbd>
          <input
            ref={customerRef}
            type="text"
            value={tab.customerName}
            onChange={e => store.setCustomerName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault()
                pluRef.current?.focus()
              }
            }}
            placeholder="Customer name"
            className="border border-gray-300 rounded-lg px-3 py-1.5
                       text-sm w-40 focus:outline-none focus:ring-2
                       focus:ring-gray-900"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <kbd className="text-xs bg-gray-100 text-gray-500 border
                          border-gray-300 px-1.5 py-0.5 rounded
                          font-mono leading-none flex-shrink-0">
            F3
          </kbd>
          <input
            ref={tableRef}
            type="text"
            value={tab.tableNumber}
            onChange={e => {
              store.setTableNumber(e.target.value)
              // auto-update tab label with table number
              if (e.target.value) {
                store.setTabLabel(tab.id, `Table ${e.target.value}`)
              }
            }}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault()
                pluRef.current?.focus()
              }
            }}
            placeholder="Table no."
            className="border border-gray-300 rounded-lg px-3 py-1.5
                       text-sm w-28 focus:outline-none focus:ring-2
                       focus:ring-gray-900"
          />
        </div>

        {/* Shortcut hints */}
        <div className="ml-auto hidden md:flex items-center gap-2.5">
          {[
            ['F2', 'name'], ['F3', 'table'], ['F12', 'pay'],
            ['↑↓', 'row'], ['+/-', 'qty'], ['Del', 'remove'],
            ['Ctrl+T', 'new tab'], ['Ctrl+W', 'close'],
          ].map(([k, d]) => (
            <div key={k} className="flex items-center gap-1">
              <kbd className="text-xs bg-gray-100 text-gray-600
                              border border-gray-300 px-1.5 py-0.5
                              rounded font-mono leading-none">
                {k}
              </kbd>
              <span className="text-xs text-gray-400">{d}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Main ─────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left — PLU + Cart */}
        <div className="flex-1 flex flex-col p-4 gap-3 overflow-hidden">
          <PLUInput
            inputRef={pluRef}
            disabled={checkoutLoading}
            tabId={tab.id}
          />

          {successMsg && (
            <div className="bg-green-50 border border-green-200
                            text-green-700 rounded-xl px-4 py-2.5
                            text-sm font-medium flex-shrink-0">
              {successMsg}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200
                            text-red-700 rounded-xl px-4 py-2.5
                            text-sm flex-shrink-0">
              {error}
            </div>
          )}

          <div className="flex-1 bg-white rounded-2xl border
                          border-gray-200 overflow-hidden flex flex-col">
            <CartTable pluInputRef={pluRef} />
          </div>
        </div>

        {/* Right — Summary */}
        <div className="w-72 bg-white border-l border-gray-200
                        flex flex-col p-5 flex-shrink-0">

          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-900">
              Order summary
            </h2>
            {tab.tableNumber && (
              <span className="text-xs bg-gray-100 text-gray-700
                               px-2 py-0.5 rounded-full font-medium">
                Table {tab.tableNumber}
              </span>
            )}
          </div>

          {tab.items.length > 0 ? (
            <div className="flex-1 overflow-auto space-y-1.5 mb-4">
              {tab.items.map(item => (
                <div key={item.short_code}
                     className="flex justify-between text-sm">
                  <span className="text-gray-600 truncate flex
                                   items-center gap-1.5">
                    <span className="font-mono text-xs bg-gray-100
                                     text-gray-600 px-1 rounded
                                     flex-shrink-0">
                      {item.short_code}
                    </span>
                    ×{item.quantity}
                  </span>
                  <span className="text-gray-900 font-medium
                                   ml-2 flex-shrink-0">
                    ₹{item.line_total.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm text-gray-400 text-center">
                Empty cart<br />
                <span className="text-xs">Type PLU + Enter</span>
              </p>
            </div>
          )}

          <CartSummary
            onCheckout={handleCheckout}
            onClear={() => {
              store.clearCart()
              pluRef.current?.focus()
            }}
            loading={checkoutLoading}
          />
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentOpen}
        saleId={currentSaleId}
        onClose={handleModalClose}
        onSuccess={handlePaymentSuccess}
        pluRef={pluRef}
      />
    </div>
  )
}