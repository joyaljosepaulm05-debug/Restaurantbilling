'use client'

import { useState, useEffect } from 'react'
import { UserPlus } from 'lucide-react'
import { useAttendanceSummary } from '@/hooks/useAttendance'
import { useAuthStore } from '@/store/authStore'
import { AttendanceSummaryCard } from './AttendanceSummaryCard'
import { TodayAttendance }       from './TodayAttendance'
import { RegisterFaceModal }     from './RegisterFaceModal'
import { CheckInStation }        from './CheckInStation'

export function AttendanceDashboard() {
  const { user }                          = useAuthStore()
  const [showRegister, setShowRegister]   = useState(false)
  const [mounted,      setMounted]        = useState(false)
  const [users,        setUsers]          = useState<any[]>([])

  const { data: summary } = useAttendanceSummary()

  useEffect(() => { setMounted(true) }, [])

  // Fetch staff list for register face modal
  useEffect(() => {
    if (!mounted) return
    import('@/lib/api').then(({ default: api }) => {
      api.get('/users/').then(r => setUsers(r.data?.results || r.data || []))
    })
  }, [mounted])

  const canManage = mounted &&
    ['OWNER', 'MANAGER'].includes(user?.role ?? '')

  return (
    <div className="bg-gray-50 min-h-full">

      {/* ── Action bar ──────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 px-6 py-2
                      flex items-center justify-between flex-shrink-0">
        <p className="text-xs text-gray-500">
          {new Date().toLocaleDateString('en-IN', {
            weekday: 'long', day: 'numeric', month: 'long'
          })}
        </p>

        {canManage && (
          <button
            onClick={() => setShowRegister(true)}
            className="flex items-center gap-1.5 bg-gray-900
                       text-white text-xs font-medium px-3 py-1.5
                       rounded-lg hover:bg-gray-800 transition-colors"
          >
            <UserPlus size={13} />
            Register face
          </button>
        )}
      </div>

      {/* ── Main content ─────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">

        {/* Summary cards */}
        {summary && (
          <AttendanceSummaryCard data={summary} />
        )}

        {/* Two column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Check-in station — left column */}
          <div className="lg:col-span-1">
            <CheckInStation />
          </div>

          {/* Today's records — right two columns */}
          <div className="lg:col-span-2">
            <TodayAttendance />
          </div>
        </div>
      </main>

      {/* Register face modal */}
      {canManage && (
        <RegisterFaceModal
          isOpen={showRegister}
          onClose={() => setShowRegister(false)}
          users={users}
        />
      )}
    </div>
  )
}