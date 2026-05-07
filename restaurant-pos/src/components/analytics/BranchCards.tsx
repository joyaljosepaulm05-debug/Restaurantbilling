'use client'

import { MapPin, TrendingUp } from 'lucide-react'

interface Branch {
  branch_id: number
  branch_name: string
  revenue: number
  bill_count: number
  avg_bill: number
  tax_collected: number
}

interface BranchCardsProps {
  branches: Branch[]
}

export function BranchCards({ branches }: BranchCardsProps) {
  const totalRevenue = branches.reduce((s, b) => s + b.revenue, 0)

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-900">
          Branch performance
        </h3>
        <p className="text-xs text-gray-500 mt-0.5">Today</p>
      </div>

      <div className="space-y-3">
        {branches.map((branch, index) => {
          const pct = totalRevenue > 0
            ? (branch.revenue / totalRevenue * 100)
            : 0

          return (
            <div key={branch.branch_id}
                 className="p-3 rounded-xl bg-gray-50
                            border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-lg flex items-center
                                   justify-center text-xs font-medium
                    ${index === 0
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-200 text-gray-600'
                    }`}>
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {branch.branch_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {branch.bill_count} bills · avg ₹{branch.avg_bill.toFixed(0)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    ₹{branch.revenue.toLocaleString('en-IN')}
                  </p>
                  <p className="text-xs text-gray-500">
                    {pct.toFixed(1)}% of total
                  </p>
                </div>
              </div>

              {/* Revenue bar */}
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gray-900 rounded-full
                              transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}

        {branches.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-6">
            No sales today yet
          </p>
        )}
      </div>
    </div>
  )
}