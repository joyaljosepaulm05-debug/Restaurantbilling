'use client'

import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts'

interface TopItem {
  name: string
  short_code: string
  total_qty: number
  total_revenue: number
}

interface TopItemsChartProps {
  items: TopItem[]
}

export function TopItemsChart({ items }: TopItemsChartProps) {
  const top5 = items.slice(0, 5)
  const maxQty = Math.max(...top5.map(i => i.total_qty), 1)

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-900">
          Top selling items
        </h3>
        <p className="text-xs text-gray-500 mt-0.5">
          Last 7 days by quantity
        </p>
      </div>

      {/* Bar chart */}
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={top5} layout="vertical"
                  margin={{ left: 0, right: 16, top: 0, bottom: 0 }}>
          <XAxis type="number" hide />
          <YAxis
            dataKey="name"
            type="category"
            width={110}
            tick={{ fontSize: 11, fill: '#6b7280' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(value: number, name: string) => [
              name === 'total_qty' ? `${value} units` : `₹${value}`,
              name === 'total_qty' ? 'Qty sold' : 'Revenue'
            ]}
            contentStyle={{
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              fontSize: '12px',
            }}
          />
          <Bar dataKey="total_qty" radius={[0, 4, 4, 0]}>
            {top5.map((_, index) => (
              <Cell
                key={index}
                fill={index === 0 ? '#111827' : `rgba(17,24,39,${0.15 + (top5.length - index) * 0.15})`}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Table below chart */}
      <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
        {top5.map((item, i) => (
          <div key={item.short_code}
               className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-400
                               w-4 text-right">
                {i + 1}
              </span>
              <span className="text-xs font-mono bg-gray-100
                               text-gray-600 px-1.5 py-0.5 rounded">
                {item.short_code}
              </span>
              <span className="text-xs text-gray-700">{item.name}</span>
            </div>
            <div className="text-right">
              <span className="text-xs font-medium text-gray-900">
                ₹{item.total_revenue.toLocaleString('en-IN')}
              </span>
              <span className="text-xs text-gray-400 ml-1.5">
                ({item.total_qty} units)
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}