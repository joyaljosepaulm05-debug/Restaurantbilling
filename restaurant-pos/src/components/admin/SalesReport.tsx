'use client'

import { useState }       from 'react'
import { useSalesReport } from '@/hooks/useAdmin'
import { toMoney }        from '@/lib/utils'
import { TrendingUp }     from 'lucide-react'

const ROLE_COLORS: Record<string, string> = {
  OWNER:     'bg-purple-100 text-purple-700',
  MANAGER:   'bg-blue-100   text-blue-700',
  BILLING:   'bg-green-100  text-green-700',
  INVENTORY: 'bg-amber-100  text-amber-700',
}

export function SalesReport() {
  const [days, setDays] = useState(30)

  const { data, isLoading } = useSalesReport({ days })
  const report = data?.report || []

  const totalRevenue = report.reduce(
    (s: number, r: any) => s + r.total_revenue, 0
  )
  const totalBills = report.reduce(
    (s: number, r: any) => s + r.total_bills, 0
  )

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-gray-500">
          {data?.period || ''}
        </p>
        <select
          value={days}
          onChange={e => setDays(Number(e.target.value))}
          className="border border-gray-300 rounded-xl px-3 py-2
                     text-sm focus:outline-none bg-white
                     focus:ring-2 focus:ring-gray-900"
        >
          {[7,14,30,60,90].map(d => (
            <option key={d} value={d}>
              Last {d} days
            </option>
          ))}
        </select>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
            Total revenue
          </p>
          <p className="text-2xl font-semibold text-gray-900">
            ₹{toMoney(totalRevenue)}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
            Total bills
          </p>
          <p className="text-2xl font-semibold text-gray-900">
            {totalBills}
          </p>
        </div>
      </div>

      {/* Per-user table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-7 h-7 border-2 border-gray-900
                          border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border
                        border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                {['Staff member','Role','Branch',
                  'Bills','Revenue','Voids','Avg bill'].map(h => (
                  <th key={h}
                      className="text-left text-xs font-medium
                                 text-gray-500 uppercase tracking-wider
                                 px-4 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {report.map((r: any, i: number) => (
                <tr key={r.user_id}
                    className="hover:bg-gray-50 transition-colors">

                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      {i === 0 && (
                        <TrendingUp size={14}
                                    className="text-amber-500
                                               flex-shrink-0" />
                      )}
                      <div className="w-7 h-7 rounded-full bg-gray-100
                                      flex items-center justify-center
                                      flex-shrink-0">
                        <span className="text-gray-600 text-xs
                                         font-medium">
                          {r.full_name?.charAt(0)?.toUpperCase()}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {r.full_name}
                      </span>
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full
                                      font-medium
                      ${ROLE_COLORS[r.role] ||
                        'bg-gray-100 text-gray-600'}`}>
                      {r.role}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-600">
                      {r.branch_name}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <span className="text-sm font-semibold text-gray-900">
                      {r.total_bills}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <span className="text-sm font-semibold text-gray-900">
                      ₹{toMoney(r.total_revenue)}
                    </span>
                    {/* Mini bar */}
                    <div className="h-1 bg-gray-100 rounded-full
                                    mt-1 overflow-hidden w-20">
                      <div
                        className="h-full bg-gray-900 rounded-full"
                        style={{
                          width: totalRevenue > 0
                            ? `${(r.total_revenue / totalRevenue * 100).toFixed(0)}%`
                            : '0%'
                        }}
                      />
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <span className={`text-sm font-medium
                      ${r.total_voids > 0
                        ? 'text-red-600' : 'text-gray-400'}`}>
                      {r.total_voids}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-700">
                      ₹{toMoney(r.avg_bill)}
                    </span>
                  </td>
                </tr>
              ))}

              {report.length === 0 && (
                <tr>
                  <td colSpan={7}
                      className="px-4 py-12 text-center text-sm
                                 text-gray-400">
                    No sales data in this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}