'use client'

import { usePathname } from 'next/navigation'
import { RefreshCw } from 'lucide-react'

// Maps URL paths to page titles
const PAGE_TITLES: Record<string, string> = {
  '/billing':    'Billing',
  '/inventory':  'Inventory',
  '/members':    'Members',
  '/attendance': 'Attendance',
  '/analytics':  'Analytics',
}

interface TopBarProps {
  onRefresh?: () => void
  isRefreshing?: boolean
  actions?: React.ReactNode   // extra buttons passed from page
}

export function TopBar({ onRefresh, isRefreshing, actions }: TopBarProps) {
  const pathname = usePathname()

  // Find the matching title
  const title = Object.entries(PAGE_TITLES).find(
    ([path]) => pathname.startsWith(path)
  )?.[1] || 'Restaurant OS'

  return (
    <header className="h-14 bg-white border-b border-gray-200
                       flex items-center justify-between
                       px-6 flex-shrink-0">
      <h1 className="text-sm font-semibold text-gray-900">
        {title}
      </h1>

      <div className="flex items-center gap-2">
        {/* Extra actions from the page */}
        {actions}

        {/* Refresh button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="text-gray-400 hover:text-gray-600 p-1.5
                       rounded-lg hover:bg-gray-100 transition-colors
                       disabled:opacity-40"
            title="Refresh"
          >
            <RefreshCw
              size={15}
              className={isRefreshing ? 'animate-spin' : ''}
            />
          </button>
        )}
      </div>
    </header>
  )
}