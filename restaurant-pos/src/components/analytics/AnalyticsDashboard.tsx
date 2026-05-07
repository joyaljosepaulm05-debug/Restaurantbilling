'use client'

import { RefreshCw, BarChart2 } from 'lucide-react'
import { useAnalytics, useTrend } from '@/hooks/useAnalytics'
import { SummaryCards }      from './SummaryCards'
import { RevenueTrendChart } from './RevenueTrendChart'
import { TopItemsChart }     from './TopItemsChart'
import { BranchCards }       from './BranchCards'
import { PaymentBreakdown }  from './PaymentBreakdown'
import { AttendanceSummary } from './AttendanceSummary'

export function AnalyticsDashboard() {
  const { data, isLoading, isError,
          refetch, isFetching }      = useAnalytics()
  const { data: trendData }          = useTrend(7)

  // ── Loading ───────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center
                      min-h-full">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-gray-900
                          border-t-transparent rounded-full
                          animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">
            Loading analytics...
          </p>
        </div>
      </div>
    )
  }

  // ── Error ─────────────────────────────────────────────────────
  if (isError) {
    return (
      <div className="flex-1 flex items-center justify-center
                      p-4 min-h-full">
        <div className="text-center max-w-sm">
          <div className="w-12 h-12 bg-red-50 rounded-2xl
                          flex items-center justify-center
                          mx-auto mb-4">
            <BarChart2 size={20} className="text-red-500" />
          </div>
          <p className="text-base font-medium text-gray-900 mb-1">
            Could not load analytics
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Make sure the Django server is running on port 8000
          </p>
          <button
            onClick={() => refetch()}
            className="bg-gray-900 text-white px-4 py-2
                       rounded-lg text-sm"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="bg-gray-50 min-h-full">

      {/* ── Slim top action bar ─────────────────────────────── */}
      <div className="bg-white border-b border-gray-200
                      px-6 py-2 flex items-center
                      justify-between flex-shrink-0">
        <p className="text-xs text-gray-500">
          {new Date().toLocaleDateString('en-IN', {
            weekday: 'long', day: 'numeric', month: 'long'
          })}
        </p>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-1.5 text-xs text-gray-500
                     hover:text-gray-800 disabled:opacity-40
                     transition-colors"
        >
          <RefreshCw
            size={13}
            className={isFetching ? 'animate-spin' : ''}
          />
          {isFetching ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* ── Charts ──────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">

        {data.summary && (
          <SummaryCards summary={data.summary} />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {(trendData || data.trend) && (
            <RevenueTrendChart data={trendData || data.trend} />
          )}
          {data.top_items?.length > 0 && (
            <TopItemsChart items={data.top_items} />
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {data.branches?.length > 0 && (
            <BranchCards branches={data.branches} />
          )}
          {data.payments && (
            <PaymentBreakdown payments={data.payments} />
          )}
          {data.attendance && (
            <AttendanceSummary data={data.attendance} />
          )}
        </div>

        <p className="text-xs text-gray-400 text-center pb-4">
          Data for {data.generated} · Auto-refreshes every 5 minutes ·
          <button
            onClick={() => refetch()}
            className="underline ml-1 hover:text-gray-600"
          >
            refresh now
          </button>
        </p>
      </main>
    </div>
  )
}