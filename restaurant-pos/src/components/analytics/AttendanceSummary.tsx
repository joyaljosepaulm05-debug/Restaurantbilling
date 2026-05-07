'use client'

import { UserCheck, UserX, Clock } from 'lucide-react'

interface AttendanceProps {
  data: {
    total_staff: number
    checked_in: number
    absent: number
    late: number
    attendance_rate: number
    by_branch: { branch: string; present: number }[]
  }
}

export function AttendanceSummary({ data }: AttendanceProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-900">
          Staff attendance
        </h3>
        <p className="text-xs text-gray-500 mt-0.5">Today</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center p-3 bg-green-50 rounded-xl">
          <UserCheck size={16} className="text-green-600 mx-auto mb-1" />
          <p className="text-xl font-semibold text-green-700">
            {data.checked_in}
          </p>
          <p className="text-xs text-green-600">Present</p>
        </div>
        <div className="text-center p-3 bg-red-50 rounded-xl">
          <UserX size={16} className="text-red-500 mx-auto mb-1" />
          <p className="text-xl font-semibold text-red-600">
            {data.absent}
          </p>
          <p className="text-xs text-red-500">Absent</p>
        </div>
        <div className="text-center p-3 bg-amber-50 rounded-xl">
          <Clock size={16} className="text-amber-600 mx-auto mb-1" />
          <p className="text-xl font-semibold text-amber-700">
            {data.late}
          </p>
          <p className="text-xs text-amber-600">Late</p>
        </div>
      </div>

      {/* Attendance rate bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Attendance rate</span>
          <span className="font-medium text-gray-900">
            {data.attendance_rate.toFixed(0)}%
          </span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${data.attendance_rate}%`,
              background: data.attendance_rate >= 80
                ? '#16a34a'
                : data.attendance_rate >= 60
                  ? '#f59e0b'
                  : '#ef4444'
            }}
          />
        </div>
      </div>

      {/* Per-branch breakdown */}
      {data.by_branch.length > 0 && (
        <div className="border-t border-gray-100 pt-3 space-y-2">
          {data.by_branch.map((b) => (
            <div key={b.branch}
                 className="flex justify-between text-xs">
              <span className="text-gray-600">{b.branch}</span>
              <span className="font-medium text-gray-900">
                {b.present} present
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}