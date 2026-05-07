'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

interface PaymentMethod {
  method: string
  count: number
  revenue: number
  percentage: number
}

interface PaymentBreakdownProps {
  payments: PaymentMethod[]
}

const METHOD_COLORS: Record<string, string> = {
  CASH:   '#111827',
  CARD:   '#3b82f6',
  UPI:    '#8b5cf6',
  CREDIT: '#f59e0b',
  SPLIT:  '#6b7280',
}

const METHOD_LABELS: Record<string, string> = {
  CASH:   'Cash',
  CARD:   'Card',
  UPI:    'UPI',
  CREDIT: 'Member Credit',
  SPLIT:  'Split',
}

export function PaymentBreakdown({ payments }: PaymentBreakdownProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-900">
          Payment methods
        </h3>
        <p className="text-xs text-gray-500 mt-0.5">Today's split</p>
      </div>

      {payments.length > 0 ? (
        <>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={payments}
                dataKey="revenue"
                nameKey="method"
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={3}
              >
                {payments.map((p) => (
                  <Cell
                    key={p.method}
                    fill={METHOD_COLORS[p.method] || '#6b7280'}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(v: number) => [
                  `₹${v.toLocaleString('en-IN')}`, 'Revenue'
                ]}
                contentStyle={{
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb',
                  fontSize: '12px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="space-y-2 mt-2">
            {payments.map((p) => (
              <div key={p.method}
                   className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{
                      background: METHOD_COLORS[p.method] || '#6b7280'
                    }}
                  />
                  <span className="text-xs text-gray-600">
                    {METHOD_LABELS[p.method] || p.method}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400">
                    {p.count} bills
                  </span>
                  <span className="text-xs font-medium text-gray-900
                                   w-16 text-right">
                    ₹{p.revenue.toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs text-gray-400 w-10 text-right">
                    {p.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="text-sm text-gray-400 text-center py-8">
          No payments today yet
        </p>
      )}
    </div>
  )
}