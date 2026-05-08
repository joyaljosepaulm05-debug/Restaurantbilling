'use client'

import { useTodayAttendance, AttendanceRecord } from '@/hooks/useAttendance'
import { RefreshCw } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

const STATUS_STYLES = {
  PRESENT:   'bg-green-50 text-green-700',
  LATE:      'bg-amber-50 text-amber-700',
  EARLY_OUT: 'bg-blue-50  text-blue-700',
}

const TYPE_STYLES = {
  CHECK_IN:  'bg-gray-900 text-white',
  CHECK_OUT: 'bg-gray-100 text-gray-700',
}

const ROLE_INITIALS: Record<string, string> = {
  OWNER:     'OW',
  MANAGER:   'MG',
  BILLING:   'BL',
  INVENTORY: 'IN',
}

export function TodayAttendance() {
  const { data: records = [], isLoading,
          refetch, isFetching } = useTodayAttendance()

  // Group by user — show latest event per person
  const byUser = records.reduce<Record<number, AttendanceRecord[]>>(
    (acc, r) => {
      if (!acc[r.user_id]) acc[r.user_id] = []
      acc[r.user_id].push(r)
      return acc
    }, {}
  )

  return (
    <div className="bg-white rounded-2xl border border-gray-200">

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4
                      border-b border-gray-200">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">
            Today's check-ins
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {records.length} events recorded
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="text-gray-400 hover:text-gray-600 p-1.5
                     rounded-lg hover:bg-gray-100 disabled:opacity-40"
        >
          <RefreshCw
            size={14}
            className={isFetching ? 'animate-spin' : ''}
          />
        </button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-7 h-7 border-2 border-gray-900
                          border-t-transparent rounded-full animate-spin" />
        </div>
      ) : records.length === 0 ? (
        <div className="flex flex-col items-center justify-center
                        py-16 text-gray-400">
          <div className="w-12 h-12 bg-gray-100 rounded-2xl
                          flex items-center justify-center mb-3">
            <span className="text-2xl">👤</span>
          </div>
          <p className="text-sm font-medium">No check-ins yet today</p>
          <p className="text-xs mt-1">
            Staff check in via the face recognition station
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {['Staff', 'Role', 'Event', 'Status',
                  'Time', 'Confidence'].map(h => (
                  <th key={h}
                      className="text-left text-xs font-medium
                                 text-gray-500 uppercase tracking-wider
                                 px-5 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {records.map((r, i) => (
                <tr key={i}
                    className="hover:bg-gray-50 transition-colors">

                  {/* Staff */}
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gray-900
                                      flex items-center justify-center
                                      flex-shrink-0">
                        <span className="text-white text-xs font-medium">
                          {r.full_name?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {r.full_name}
                      </span>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="px-5 py-3">
                    <span className="text-xs bg-gray-100 text-gray-600
                                     px-2 py-0.5 rounded-full font-medium">
                      {r.role}
                    </span>
                  </td>

                  {/* Event type */}
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full
                                      font-medium
                      ${TYPE_STYLES[r.attendance_type]}`}>
                      {r.attendance_type === 'CHECK_IN'
                        ? 'Check in' : 'Check out'}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full
                                      font-medium
                      ${STATUS_STYLES[r.status] ||
                        'bg-gray-100 text-gray-600'}`}>
                      {r.status}
                    </span>
                  </td>

                  {/* Time */}
                  <td className="px-5 py-3">
                    <span className="text-sm text-gray-700">
                      {formatDateTime(r.timestamp)}
                    </span>
                  </td>

                  {/* Confidence */}
                  <td className="px-5 py-3">
                    <span className="text-sm text-gray-500">
                      {r.confidence || '—'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}