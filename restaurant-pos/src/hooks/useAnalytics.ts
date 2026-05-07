import { useQuery } from '@tanstack/react-query'
import { analyticsApi } from '@/lib/api'

export function useAnalytics() {
  return useQuery({
    queryKey: ['analytics', 'mobile'],
    queryFn: async () => {
      const response = await analyticsApi.getMobileDashboard()
      return response.data
    },
    // WHY 5 minutes: analytics don't need to be live-second
    // refreshing every 5 mins is enough for the owner
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    retry: 2,
  })
}

export function useTrend(days = 7) {
  return useQuery({
    queryKey: ['analytics', 'trend', days],
    queryFn: async () => {
      const response = await analyticsApi.getTrend(days)
      return response.data.trend
    },
    staleTime: 5 * 60 * 1000,
  })
}