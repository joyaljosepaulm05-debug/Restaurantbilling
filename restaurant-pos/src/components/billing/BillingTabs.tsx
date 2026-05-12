'use client'

import { useRef, useEffect } from 'react'
import { X, Plus } from 'lucide-react'
import { useTabsStore, BillingTab } from '@/store/tabsStore'

export function BillingTabs() {
  const { tabs, activeTabId, addTab,
          closeTab, setActiveTab } = useTabsStore()
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map())

  // Scroll active tab into view
  useEffect(() => {
    tabRefs.current.get(activeTabId)?.scrollIntoView({
      behavior: 'smooth', block: 'nearest', inline: 'nearest'
    })
  }, [activeTabId])

  return (
    <div className="bg-white border-b border-gray-200
                    flex items-end gap-0 flex-shrink-0
                    overflow-x-auto">

      {/* Tab list */}
      <div className="flex items-end gap-0 flex-1 min-w-0">
        {tabs.map((tab, i) => {
          const isActive  = tab.id === activeTabId
          const hasItems  = tab.items.length > 0

          return (
            <button
              key={tab.id}
              ref={el => {
                if (el) tabRefs.current.set(tab.id, el)
                else tabRefs.current.delete(tab.id)
              }}
              onClick={() => setActiveTab(tab.id)}
              className={`
                relative flex items-center gap-2 px-4 py-2.5
                text-sm font-medium border-b-2 flex-shrink-0
                transition-all duration-150 group max-w-[180px]
                ${isActive
                  ? 'border-gray-900 text-gray-900 bg-gray-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }
              `}
              title={`${tab.label} — Ctrl+${i + 1}`}
            >
              {/* Tab index badge */}
              <span className={`
                text-xs font-mono w-4 h-4 rounded flex items-center
                justify-center flex-shrink-0 font-semibold
                ${isActive
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-200 text-gray-500'
                }
              `}>
                {i + 1}
              </span>

              {/* Label */}
              <span className="truncate max-w-[100px]">
                {tab.tableNumber
                  ? `T${tab.tableNumber}`
                  : tab.label}
              </span>

              {/* Item count badge */}
              {hasItems && (
                <span className={`
                  text-xs rounded-full px-1.5 py-0.5 font-medium
                  leading-none flex-shrink-0
                  ${isActive
                    ? 'bg-gray-200 text-gray-800'
                    : 'bg-gray-100 text-gray-500'
                  }
                `}>
                  {tab.items.reduce((s, i) => s + i.quantity, 0)}
                </span>
              )}

              {/* Close — only show if more than 1 tab */}
              {tabs.length > 1 && (
                <span
                  onClick={e => {
                    e.stopPropagation()
                    closeTab(tab.id)
                  }}
                  className={`
                    opacity-0 group-hover:opacity-100 transition-opacity
                    w-4 h-4 rounded flex items-center justify-center
                    hover:bg-gray-300 flex-shrink-0 cursor-pointer
                    ${isActive ? 'opacity-60' : ''}
                  `}
                  title="Close tab (Ctrl+W)"
                >
                  <X size={10} />
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* New tab button */}
      <button
        onClick={addTab}
        title="New tab (Ctrl+T)"
        className="flex items-center gap-1 px-3 py-2.5 text-gray-400
                   hover:text-gray-700 hover:bg-gray-100 flex-shrink-0
                   border-b-2 border-transparent transition-colors"
      >
        <Plus size={14} />
        <kbd className="text-xs bg-gray-100 border border-gray-300
                        text-gray-500 px-1 rounded font-mono
                        leading-none">
          Ctrl+T
        </kbd>
      </button>
    </div>
  )
}