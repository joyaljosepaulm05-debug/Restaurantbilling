'use client'

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts'

interface TrendPoint {
  date: string
  revenue: number
  bill_count: number
}

interface RevenueTrendChartProps {
  data: TrendPoint[]
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-IN', {
    month: 'short', day: 'numeric'
  })
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null

  return (
    <div className="bg-white border border-gray-200 rounded-xl
                    shadow-sm p-3 text-sm">
      <p className="text-gray-500 mb-1">{formatDate(label)}</p>
      <p className="font-semibold text-gray-900">
        ₹{payload[0]?.value?.toLocaleString('en-IN')}
      </p>
      <p className="text-gray-500 text-xs">
        {payload[1]?.value} bills
      </p>
    </div>
  )
}

export function RevenueTrendChart({ data }: RevenueTrendChartProps) {
  const formatted = data.map(d => ({
    ...d,
    label: formatDate(d.date),
  }))

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">
            Revenue trend
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Last 7 days
          </p>
        </div>
        <div className="text-xs text-gray-400 bg-gray-50 px-2.5
                        py-1 rounded-lg border border-gray-200">
          Daily revenue
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={formatted}
                   margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3"
                         stroke="#f0f0f0" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#111827"
            strokeWidth={2}
            dot={{ r: 3, fill: '#111827', strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="bill_count"
            stroke="#d1d5db"
            strokeWidth={1.5}
            dot={false}
            strokeDasharray="4 4"
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="flex items-center gap-4 mt-2">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 bg-gray-900 rounded" />
          <span className="text-xs text-gray-500">Revenue</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 bg-gray-300 rounded
                          border-dashed" />
          <span className="text-xs text-gray-500">Bills</span>
        </div>
      </div>
    </div>
  )
}