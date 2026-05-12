'use client'

import { useState }     from 'react'
import { useAuditLog }  from '@/hooks/useAdmin'
import { RefreshCw }    from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

const ACTION_COLORS: Record<string, string> = {
  USER_CREATED:     'bg-blue-100  text-blue-700',
  USER_UPDATED:     'bg-gray-100  text-gray-700',
  USER_DEACTIVATED: 'bg-red-100   text-red-600',
  USER_ACTIVATED:   'bg-green-100 text-green-700',
  PASSWORD_RESET:   'bg-amber-100 text-amber-700',
  FACE_REGISTERED:  'bg-purple-100 text-purple-700',
  BRANCH_CREATED:   'bg-teal-100  text-teal-700',
  BRANCH_UPDATED:   'bg-gray-100  text-gray-700',
  BRANCH_TOGGLED:   'bg-orange-100 text-orange-700',
  LOGIN:            'bg-green-50  text-green-600',
  LOGOUT:           'bg-gray-50   text-gray-500',
}

const DOT_COLORS: Record<string, string> = {
  USER_CREATED: '#3B82F6', USER_DEACTIVATED: '#EF4444',
  USER_ACTIVATED: '#22C55E', PASSWORD_RESET: '#F59E0B',
  FACE_REGISTERED: '#8B5CF6', BRANCH_CREATED: '#14B8A6',
  LOGIN: '#22C55E', LOGOUT: '#9CA3AF',
}

export function AuditLog() {
  const [days,   setDays]   = useState(7)
  const [action, setAction] = useState('')

  const { data, isLoading, refetch, isFetching } = useAuditLog({
    days,
    action_type: action || undefined,
  })

  const logs = Array.isArray(data) ? data : (data as any)?.results || []

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-5">
        <select
          value={action}
          onChange={e => setAction(e.target.value)}
          className="border border-gray-300 rounded-xl px-3 py-2
                     text-sm focus:outline-none bg-white
                     focus:ring-2 focus:ring-gray-900"
        >
          <option value="">All events</option>
          {['USER_CREATED','USER_UPDATED','USER_DEACTIVATED',
            'USER_ACTIVATED','PASSWORD_RESET','FACE_REGISTERED',
            'BRANCH_CREATED','BRANCH_UPDATED','LOGIN','LOGOUT'
          ].map(a => (
            <option key={a} value={a}>
              {a.replace(/_/g,' ')}
            </option>
          ))}
        </select>

        <select
          value={days}
          onChange={e => setDays(Number(e.target.value))}
          className="border border-gray-300 rounded-xl px-3 py-2
                     text-sm focus:outline-none bg-white
                     focus:ring-2 focus:ring-gray-900"
        >
          {[1,7,14,30].map(d => (
            <option key={d} value={d}>Last {d} day{d>1?'s':''}</option>
          ))}
        </select>

        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="ml-auto text-gray-400 hover:text-gray-600 p-2
                     rounded-xl hover:bg-gray-100 disabled:opacity-40"
        >
          <RefreshCw
            size={15}
            className={isFetching ? 'animate-spin' : ''}
          />
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-7 h-7 border-2 border-gray-900
                          border-t-transparent rounded-full animate-spin" />
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-sm">No audit events in this period.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log: any) => (
            <div key={log.id}
                 className="bg-white rounded-xl border border-gray-200
                            p-4 flex items-start gap-3">
              {/* Dot */}
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5"
                style={{
                  background: DOT_COLORS[log.action_type] || '#9CA3AF'
                }}
              />

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-gray-900">
                    {log.performed_by_name}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full
                                    font-medium
                    ${ACTION_COLORS[log.action_type] ||
                      'bg-gray-100 text-gray-600'}`}>
                    {log.action_type.replace(/_/g,' ')}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-0.5">
                  {log.description}
                </p>
                {log.target_user_name && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    Target: {log.target_user_name}
                  </p>
                )}
                {log.target_branch_name && (
                  <p className="text-xs text-gray-400">
                    Branch: {log.target_branch_name}
                  </p>
                )}
              </div>

              {/* Time */}
              <div className="text-xs text-gray-400 flex-shrink-0">
                {formatDateTime(log.created_at)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}