'use client'

import { TrendingUp, TrendingDown, Receipt,
         ShoppingBag, Users, IndianRupee } from 'lucide-react'

interface SummaryCardsProps {
  summary: {
    total_revenue: number
    total_bills: number
    avg_bill_value: number
    total_items_sold: number
    active_branches: number
    revenue_vs_yesterday: {
      change_percent: number
      trend: 'up' | 'down'
      yesterday_revenue: number
    }
  }
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  const { revenue_vs_yesterday: rvs } = summary
  const isUp = rvs.trend === 'up'

  const cards = [
    {
      label:   "Today's revenue",
      value:   `₹${summary.total_revenue.toLocaleString('en-IN', {
                  minimumFractionDigits: 2, maximumFractionDigits: 2
                })}`,
      icon:    <IndianRupee size={18} />,
      accent:  'bg-teal-50 text-teal-700',
      badge:   (
        <span className={`flex items-center gap-1 text-xs font-medium
          ${isUp ? 'text-green-600' : 'text-red-500'}`}>
          {isUp
            ? <TrendingUp size={13} />
            : <TrendingDown size={13} />}
          {Math.abs(rvs.change_percent).toFixed(1)}% vs yesterday
        </span>
      ),
    },
    {
      label: 'Bills today',
      value: summary.total_bills.toString(),
      icon:  <Receipt size={18} />,
      accent:'bg-blue-50 text-blue-700',
    },
    {
      label: 'Avg bill value',
      value: `₹${summary.avg_bill_value.toFixed(2)}`,
      icon:  <ShoppingBag size={18} />,
      accent:'bg-purple-50 text-purple-700',
    },
    {
      label: 'Items sold',
      value: summary.total_items_sold.toString(),
      icon:  <Users size={18} />,
      accent:'bg-amber-50 text-amber-700',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div key={card.label}
             className="bg-white rounded-2xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-gray-500 uppercase
                             tracking-wide">
              {card.label}
            </span>
            <div className={`w-8 h-8 rounded-lg flex items-center
                             justify-center ${card.accent}`}>
              {card.icon}
            </div>
          </div>
          <p className="text-2xl font-semibold text-gray-900">
            {card.value}
          </p>
          {card.badge && (
            <div className="mt-1.5">{card.badge}</div>
          )}
        </div>
      ))}
    </div>
  )
}