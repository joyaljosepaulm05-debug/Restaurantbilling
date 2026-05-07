'use client'

import { useState } from 'react'
import { X, Banknote, CreditCard, Smartphone, Star } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'

interface PaymentModalProps {
  isOpen: boolean
  saleId: number | null
  onClose: () => void
  onSuccess: (billNumber: string) => void
}

type PaymentMethod = 'CASH' | 'CARD' | 'UPI' | 'CREDIT'

const PAYMENT_METHODS: {
  id: PaymentMethod
  label: string
  icon: React.ReactNode
  color: string
}[] = [
  {
    id: 'CASH',
    label: 'Cash',
    icon: <Banknote size={20} />,
    color: 'bg-green-50 border-green-200 text-green-700',
  },
  {
    id: 'CARD',
    label: 'Card',
    icon: <CreditCard size={20} />,
    color: 'bg-blue-50 border-blue-200 text-blue-700',
  },
  {
    id: 'UPI',
    label: 'UPI',
    icon: <Smartphone size={20} />,
    color: 'bg-purple-50 border-purple-200 text-purple-700',
  },
  {
    id: 'CREDIT',
    label: 'Member Credit',
    icon: <Star size={20} />,
    color: 'bg-amber-50 border-amber-200 text-amber-700',
  },
]

export function PaymentModal({
  isOpen, saleId, onClose, onSuccess
}: PaymentModalProps) {
  const { grandTotal, clearCart } = useCartStore()
  const total = grandTotal()

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('CASH')
  const [cashReceived, setCashReceived]     = useState('')
  const [cardRef, setCardRef]               = useState('')
  const [upiRef, setUpiRef]                 = useState('')
  const [memberCard, setMemberCard]         = useState('')
  const [loading, setLoading]               = useState(false)
  const [error, setError]                   = useState('')

  const change = selectedMethod === 'CASH'
    ? Math.max(0, parseFloat(cashReceived || '0') - total)
    : 0

  const handlePayment = async () => {
    if (!saleId) return
    setError('')
    setLoading(true)

    try {
      const { billingApi } = await import('@/lib/api')

      if (selectedMethod === 'CREDIT') {
        // Credit payment — different endpoint
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/billing/sales/${saleId}/pay-credit/`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('access_token')}`,
            },
            body: JSON.stringify({ card_number: memberCard }),
          }
        )
        const data = await response.json()
        if (!data.success) throw new Error(data.error)

        clearCart()
        onSuccess(data.bill_number)

      } else {
        // Cash / Card / UPI payment
        const amount = selectedMethod === 'CASH'
          ? parseFloat(cashReceived || String(total))
          : total

        const transactionRef =
          selectedMethod === 'CARD' ? cardRef :
          selectedMethod === 'UPI'  ? upiRef  : ''

        const response = await billingApi.processPayment(saleId, [{
          method: selectedMethod,
          amount,
          transaction_ref: transactionRef,
        }])

        const { sale } = response.data
        clearCart()
        onSuccess(sale.bill_number)
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center
                    justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md
                      shadow-xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between p-5
                        border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Payment
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Total due: <span className="font-semibold text-gray-900">
                ₹{total.toFixed(2)}
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600
                       transition-colors p-1 rounded-lg
                       hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">

          {/* Payment method selector */}
          <div className="grid grid-cols-4 gap-2">
            {PAYMENT_METHODS.map((method) => (
              <button
                key={method.id}
                onClick={() => setSelectedMethod(method.id)}
                className={`
                  flex flex-col items-center gap-1.5 p-3 rounded-xl
                  border-2 transition-all text-sm font-medium
                  ${selectedMethod === method.id
                    ? method.color + ' border-current'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }
                `}
              >
                {method.icon}
                <span className="text-xs">{method.label}</span>
              </button>
            ))}
          </div>

          {/* Method-specific inputs */}
          {selectedMethod === 'CASH' && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium
                                  text-gray-700 mb-1">
                  Cash received
                </label>
                <input
                  type="number"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  placeholder={total.toFixed(2)}
                  autoFocus
                  className="w-full border border-gray-300 rounded-xl
                             px-4 py-2.5 text-lg font-mono
                             focus:outline-none focus:ring-2
                             focus:ring-gray-900"
                />
              </div>
              {cashReceived && parseFloat(cashReceived) >= total && (
                <div className="flex justify-between bg-green-50
                                rounded-xl px-4 py-3 text-green-700">
                  <span className="text-sm font-medium">Change</span>
                  <span className="font-semibold">
                    ₹{change.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          )}

          {selectedMethod === 'CARD' && (
            <div>
              <label className="block text-sm font-medium
                                text-gray-700 mb-1">
                Card approval reference (optional)
              </label>
              <input
                type="text"
                value={cardRef}
                onChange={(e) => setCardRef(e.target.value)}
                placeholder="e.g. HDFC1234567"
                autoFocus
                className="w-full border border-gray-300 rounded-xl
                           px-4 py-2.5 text-sm
                           focus:outline-none focus:ring-2
                           focus:ring-gray-900"
              />
            </div>
          )}

          {selectedMethod === 'UPI' && (
            <div>
              <label className="block text-sm font-medium
                                text-gray-700 mb-1">
                UPI transaction ID
              </label>
              <input
                type="text"
                value={upiRef}
                onChange={(e) => setUpiRef(e.target.value)}
                placeholder="e.g. 402112345678"
                autoFocus
                className="w-full border border-gray-300 rounded-xl
                           px-4 py-2.5 text-sm
                           focus:outline-none focus:ring-2
                           focus:ring-gray-900"
              />
            </div>
          )}

          {selectedMethod === 'CREDIT' && (
            <div>
              <label className="block text-sm font-medium
                                text-gray-700 mb-1">
                Member card number
              </label>
              <input
                type="text"
                value={memberCard}
                onChange={(e) => setMemberCard(e.target.value.toUpperCase())}
                placeholder="e.g. MEM-A3F9B2C1"
                autoFocus
                className="w-full border border-gray-300 rounded-xl
                           px-4 py-2.5 text-sm font-mono
                           focus:outline-none focus:ring-2
                           focus:ring-gray-900"
              />
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200
                            text-red-700 rounded-xl p-3 text-sm">
              {error}
            </div>
          )}

          {/* Confirm button */}
          <button
            onClick={handlePayment}
            disabled={loading || (
              selectedMethod === 'CASH' &&
              cashReceived !== '' &&
              parseFloat(cashReceived) < total
            )}
            className="w-full bg-gray-900 text-white rounded-xl
                       py-3 font-medium text-sm
                       hover:bg-gray-800 disabled:opacity-40
                       disabled:cursor-not-allowed transition-colors"
          >
            {loading
              ? 'Processing...'
              : `Confirm ${selectedMethod} Payment ₹${total.toFixed(2)}`
            }
          </button>
        </div>
      </div>
    </div>
  )
}