'use client'

import { UserCheck, UserX, Clock, Users } from 'lucide-react'

interface SummaryProps {
  data: {
    total_staff:     number
    checked_in:      number
    absent:          number
    late:            number
    attendance_rate: number
    by_branch?:      { branch: string; present: number }[]
  }
}

export function AttendanceSummaryCard({ data }: SummaryProps) {
  const rate = data.attendance_rate ?? 0

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">

      {/* Total staff */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-gray-500 uppercase
                           tracking-wide">
            Total staff
          </span>
          <div className="w-8 h-8 bg-gray-100 rounded-lg flex
                          items-center justify-center">
            <Users size={16} className="text-gray-600" />
          </div>
        </div>
        <p className="text-2xl font-semibold text-gray-900">
          {data.total_staff}
        </p>
      </div>

      {/* Present */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-gray-500 uppercase
                           tracking-wide">
            Present
          </span>
          <div className="w-8 h-8 bg-green-50 rounded-lg flex
                          items-center justify-center">
            <UserCheck size={16} className="text-green-600" />
          </div>
        </div>
        <p className="text-2xl font-semibold text-green-700">
          {data.checked_in}
        </p>
        <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full transition-all"
            style={{ width: `${rate}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-1">
          {rate.toFixed(0)}% attendance rate
        </p>
      </div>

      {/* Absent */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-gray-500 uppercase
                           tracking-wide">
            Absent
          </span>
          <div className="w-8 h-8 bg-red-50 rounded-lg flex
                          items-center justify-center">
            <UserX size={16} className="text-red-500" />
          </div>
        </div>
        <p className="text-2xl font-semibold text-red-600">
          {data.absent}
        </p>
      </div>

      {/* Late */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-gray-500 uppercase
                           tracking-wide">
            Late arrivals
          </span>
          <div className="w-8 h-8 bg-amber-50 rounded-lg flex
                          items-center justify-center">
            <Clock size={16} className="text-amber-600" />
          </div>
        </div>
        <p className="text-2xl font-semibold text-amber-700">
          {data.late}
        </p>
      </div>
    </div>
  )
}