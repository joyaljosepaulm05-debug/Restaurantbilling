'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Banknote, CreditCard,
         Smartphone, Star }            from 'lucide-react'
import { useTabsStore }                from '@/store/tabsStore'
import { useKeyboard }                 from '@/hooks/useKeyboard'

interface PaymentModalProps {
  isOpen:   boolean
  saleId:   number | null
  onClose:  () => void
  onSuccess:(billNumber: string) => void
  pluRef?:  React.RefObject<HTMLInputElement>
}

type PaymentMethod = 'CASH' | 'CARD' | 'UPI' | 'CREDIT'

const METHODS: {
  id:    PaymentMethod
  label: string
  key:   string
  icon:  React.ReactNode
  color: string
}[] = [
  {
    id: 'CASH', label: 'Cash', key: 'C',
    icon: <Banknote size={18} />,
    color: 'border-green-400 bg-green-50 text-green-800',
  },
  {
    id: 'CARD', label: 'Card', key: 'D',
    icon: <CreditCard size={18} />,
    color: 'border-blue-400 bg-blue-50 text-blue-800',
  },
  {
    id: 'UPI', label: 'UPI', key: 'U',
    icon: <Smartphone size={18} />,
    color: 'border-purple-400 bg-purple-50 text-purple-800',
  },
  {
    id: 'CREDIT', label: 'Member credit', key: 'M',
    icon: <Star size={18} />,
    color: 'border-amber-400 bg-amber-50 text-amber-800',
  },
]

// Quick cash presets
const CASH_PRESETS = [50, 100, 200, 500, 1000, 2000]

export function PaymentModal({
  isOpen, saleId, onClose, onSuccess, pluRef
}: PaymentModalProps) {
  const { grandTotal, clearCart } = useTabsStore()
  const total = grandTotal()

  const [method,     setMethod]     = useState<PaymentMethod>('CASH')
  const [cashInput,  setCashInput]  = useState('')
  const [cardRef,    setCardRef]    = useState('')
  const [upiRef,     setUpiRef]     = useState('')
  const [memberCard, setMemberCard] = useState('')
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState('')

  const cashInputRef   = useRef<HTMLInputElement>(null)
  const memberInputRef = useRef<HTMLInputElement>(null)

  const change = method === 'CASH'
    ? Math.max(0, parseFloat(cashInput || '0') - total)
    : 0

  // Focus cash input when modal opens with CASH selected
  useEffect(() => {
    if (isOpen && method === 'CASH') {
      setTimeout(() => cashInputRef.current?.focus(), 100)
    }
    if (isOpen && method === 'CREDIT') {
      setTimeout(() => memberInputRef.current?.focus(), 100)
    }
  }, [isOpen, method])

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setMethod('CASH')
      setCashInput('')
      setCardRef('')
      setUpiRef('')
      setMemberCard('')
      setError('')
      setTimeout(() => cashInputRef.current?.focus(), 150)
    }
  }, [isOpen])

  const handlePayment = async () => {
    if (!saleId) return
    setError('')
    setLoading(true)

    try {
      const { billingApi } = await import('@/lib/api')

      if (method === 'CREDIT') {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/billing/sales/${saleId}/pay-credit/`,
          {
            method:  'POST',
            headers: {
              'Content-Type':  'application/json',
              'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            },
            body: JSON.stringify({ card_number: memberCard }),
          }
        )
        const data = await response.json()
        if (!data.success) throw new Error(data.error)
        clearCart()
        onSuccess(data.bill_number)

      } else {
        const amount = method === 'CASH'
          ? parseFloat(cashInput || String(total))
          : total

        const txRef =
          method === 'CARD' ? cardRef :
          method === 'UPI'  ? upiRef  : ''

        const response = await billingApi.processPayment(saleId, [{
          method,
          amount,
          transaction_ref: txRef,
        }])
        clearCart()
        onSuccess(response.data.sale.bill_number)
      }

    } catch (err: any) {
      setError(
        err.response?.data?.error ||
        err.message ||
        'Payment failed. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  // ── Keyboard shortcuts inside modal ────────────────────────
  useKeyboard({
    // C → Cash, D → Card, U → UPI, M → Member
    'c': (e) => { if (isOpen) { e.preventDefault(); setMethod('CASH');   setTimeout(()=>cashInputRef.current?.focus(),50) }},
    'C': (e) => { if (isOpen) { e.preventDefault(); setMethod('CASH');   setTimeout(()=>cashInputRef.current?.focus(),50) }},
    'd': (e) => { if (isOpen) { e.preventDefault(); setMethod('CARD') }},
    'D': (e) => { if (isOpen) { e.preventDefault(); setMethod('CARD') }},
    'u': (e) => { if (isOpen) { e.preventDefault(); setMethod('UPI')  }},
    'U': (e) => { if (isOpen) { e.preventDefault(); setMethod('UPI')  }},
    'm': (e) => { if (isOpen) { e.preventDefault(); setMethod('CREDIT'); setTimeout(()=>memberInputRef.current?.focus(),50) }},
    'M': (e) => { if (isOpen) { e.preventDefault(); setMethod('CREDIT'); setTimeout(()=>memberInputRef.current?.focus(),50) }},

    // F12 or Enter on summary → confirm
    'F12': (e) => {
      if (isOpen) { e.preventDefault(); handlePayment() }
    },

    // Esc → close
    'Escape': () => { if (isOpen) onClose() },

    // Number keys → quick cash presets (1=50, 2=100, 3=200, 4=500, 5=1000, 6=2000)
    '1': (e) => { if (isOpen && method === 'CASH' && document.activeElement?.tagName !== 'INPUT') { e.preventDefault(); setCashInput('50') }},
    '2': (e) => { if (isOpen && method === 'CASH' && document.activeElement?.tagName !== 'INPUT') { e.preventDefault(); setCashInput('100') }},
    '3': (e) => { if (isOpen && method === 'CASH' && document.activeElement?.tagName !== 'INPUT') { e.preventDefault(); setCashInput('200') }},
    '4': (e) => { if (isOpen && method === 'CASH' && document.activeElement?.tagName !== 'INPUT') { e.preventDefault(); setCashInput('500') }},
    '5': (e) => { if (isOpen && method === 'CASH' && document.activeElement?.tagName !== 'INPUT') { e.preventDefault(); setCashInput('1000') }},
    '6': (e) => { if (isOpen && method === 'CASH' && document.activeElement?.tagName !== 'INPUT') { e.preventDefault(); setCashInput('2000') }},
  }, [isOpen, method, handlePayment])

  if (!isOpen) return null

  const canConfirm = !loading && (
    method === 'CASH'   ? true :
    method === 'CARD'   ? true :
    method === 'UPI'    ? true :
    method === 'CREDIT' ? memberCard.length > 5 : false
  )

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center
                    justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md
                      shadow-2xl overflow-hidden">

        {/* ── Header ──────────────────────────────────────── */}
        <div className="flex items-center justify-between p-5
                        border-b border-gray-200">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Payment
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Total due:{' '}
              <span className="font-bold text-gray-900 text-base">
                ₹{total.toFixed(2)}
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5
                       rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">

          {/* ── Method selector with keyboard hints ─────────── */}
          <div className="grid grid-cols-4 gap-2">
            {METHODS.map(m => (
              <button
                key={m.id}
                onClick={() => {
                  setMethod(m.id)
                  if (m.id === 'CASH')
                    setTimeout(() => cashInputRef.current?.focus(), 50)
                  if (m.id === 'CREDIT')
                    setTimeout(() => memberInputRef.current?.focus(), 50)
                }}
                className={`
                  flex flex-col items-center gap-1.5 p-2.5 rounded-xl
                  border-2 transition-all text-sm font-medium relative
                  ${method === m.id
                    ? m.color
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }
                `}
              >
                {/* Keyboard hint badge */}
                <kbd className={`
                  absolute -top-2 -right-1 text-xs px-1 py-0.5
                  rounded border font-mono leading-none
                  ${method === m.id
                    ? 'bg-white border-current text-current'
                    : 'bg-gray-100 border-gray-300 text-gray-500'
                  }
                `}>
                  {m.key}
                </kbd>
                {m.icon}
                <span className="text-xs">{m.label}</span>
              </button>
            ))}
          </div>

          {/* ── Cash inputs ──────────────────────────────────── */}
          {method === 'CASH' && (
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-gray-700">
                    Cash received
                  </label>
                  <span className="text-xs text-gray-400">
                    Press 1–6 for presets
                  </span>
                </div>
                <input
                  ref={cashInputRef}
                  type="number"
                  value={cashInput}
                  onChange={e => setCashInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handlePayment()
                    }
                  }}
                  placeholder={total.toFixed(2)}
                  className="w-full border border-gray-300 rounded-xl
                             px-4 py-2.5 text-xl font-mono
                             focus:outline-none focus:ring-2
                             focus:ring-gray-900"
                />
              </div>

              {/* Quick cash presets */}
              <div className="grid grid-cols-6 gap-1.5">
                {CASH_PRESETS.map((preset, i) => (
                  <button
                    key={preset}
                    onClick={() => setCashInput(String(preset))}
                    className={`
                      py-1.5 rounded-lg text-xs font-medium
                      border transition-colors relative
                      ${cashInput === String(preset)
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                      }
                    `}
                  >
                    <kbd className="absolute -top-1.5 -right-1
                                    text-xs bg-white border
                                    border-gray-300 text-gray-400
                                    px-0.5 rounded font-mono
                                    leading-none hidden sm:block">
                      {i + 1}
                    </kbd>
                    ₹{preset}
                  </button>
                ))}
              </div>

              {/* Change display */}
              {cashInput && parseFloat(cashInput) >= total && (
                <div className="flex items-center justify-between
                                bg-green-50 rounded-xl px-4 py-3
                                border border-green-200">
                  <span className="text-sm font-medium text-green-700">
                    Change to return
                  </span>
                  <span className="text-xl font-bold text-green-700">
                    ₹{change.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* ── Card input ───────────────────────────────────── */}
          {method === 'CARD' && (
            <div>
              <label className="block text-xs font-medium
                                text-gray-700 mb-1">
                Approval reference (optional)
              </label>
              <input
                type="text"
                value={cardRef}
                onChange={e => setCardRef(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handlePayment()}
                placeholder="e.g. HDFC1234567"
                autoFocus
                className="w-full border border-gray-300 rounded-xl
                           px-4 py-2.5 text-sm focus:outline-none
                           focus:ring-2 focus:ring-gray-900"
              />
            </div>
          )}

          {/* ── UPI input ────────────────────────────────────── */}
          {method === 'UPI' && (
            <div>
              <label className="block text-xs font-medium
                                text-gray-700 mb-1">
                UPI transaction ID
              </label>
              <input
                type="text"
                value={upiRef}
                onChange={e => setUpiRef(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handlePayment()}
                placeholder="e.g. 402112345678"
                autoFocus
                className="w-full border border-gray-300 rounded-xl
                           px-4 py-2.5 text-sm focus:outline-none
                           focus:ring-2 focus:ring-gray-900"
              />
            </div>
          )}

          {/* ── Member credit ─────────────────────────────────── */}
          {method === 'CREDIT' && (
            <div>
              <label className="block text-xs font-medium
                                text-gray-700 mb-1">
                Member card number
              </label>
              <input
                ref={memberInputRef}
                type="text"
                value={memberCard}
                onChange={e => setMemberCard(
                  e.target.value.toUpperCase()
                )}
                onKeyDown={e => e.key === 'Enter' && handlePayment()}
                placeholder="MEM-XXXXXXXX"
                className="w-full border border-gray-300 rounded-xl
                           px-4 py-2.5 text-sm font-mono
                           focus:outline-none focus:ring-2
                           focus:ring-gray-900"
              />
            </div>
          )}

          {/* ── Error ────────────────────────────────────────── */}
          {error && (
            <div className="bg-red-50 border border-red-200
                            text-red-700 rounded-xl p-3 text-sm">
              {error}
            </div>
          )}

          {/* ── Confirm button ───────────────────────────────── */}
          <button
            onClick={handlePayment}
            disabled={!canConfirm}
            className="w-full bg-gray-900 text-white rounded-xl
                       py-3.5 font-semibold text-sm
                       hover:bg-gray-800 disabled:opacity-40
                       transition-colors flex items-center
                       justify-center gap-2"
          >
            {loading ? 'Processing...' : (
              <>
                Confirm payment ₹{total.toFixed(2)}
                <kbd className="bg-white/20 px-1.5 py-0.5
                                rounded text-xs font-mono">
                  F12
                </kbd>
              </>
            )}
          </button>

          {/* ── Keyboard shortcut reminder ───────────────────── */}
          <div className="grid grid-cols-4 gap-1 pt-1">
            {METHODS.map(m => (
              <div key={m.id}
                   className="text-center text-xs text-gray-400">
                <kbd className="bg-gray-100 border border-gray-300
                                text-gray-600 px-1.5 py-0.5 rounded
                                font-mono">
                  {m.key}
                </kbd>
                <span className="ml-1">{m.label.split(' ')[0]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}