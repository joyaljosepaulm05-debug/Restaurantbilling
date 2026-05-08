import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { attendanceApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

export function useTodayAttendance() {
  const { user } = useAuthStore()

  return useQuery({
    queryKey: ['attendance', 'today', user?.branch_id],
    queryFn:  async () => {
      const response = await attendanceApi.getToday(
        user?.branch_id ?? undefined
      )
      return response.data.records as AttendanceRecord[]
    },
    refetchInterval: 60 * 1000,   // refresh every minute
    staleTime:       30 * 1000,
  })
}

export function useAttendanceSummary(date?: string) {
  const { user } = useAuthStore()

  return useQuery({
    queryKey: ['attendance', 'summary', user?.branch_id, date],
    queryFn:  async () => {
      const response = await attendanceApi.getSummary(
        user?.branch_id ?? undefined, date
      )
      return response.data
    },
    staleTime: 30 * 1000,
  })
}

export function useRegisterFace() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, imageData }: {
      userId: number; imageData: string
    }) => attendanceApi.registerFace(userId, imageData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
    },
  })
}

// ── Types ─────────────────────────────────────────────────────
export interface AttendanceRecord {
  user_id:         number
  full_name:       string
  role:            string
  attendance_type: 'CHECK_IN' | 'CHECK_OUT'
  status:          'PRESENT' | 'LATE' | 'EARLY_OUT'
  timestamp:       string
  confidence:      string
}