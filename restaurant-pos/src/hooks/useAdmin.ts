import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '@/lib/api'

export function useAdminUsers(params?: any) {
  return useQuery({
    queryKey: ['admin', 'users', params],
    queryFn:  async () => {
      const r = await adminApi.getUsers(params)
      return r.data
    },
    staleTime: 30 * 1000,
  })
}

export function useAdminBranches() {
  return useQuery({
    queryKey: ['admin', 'branches'],
    queryFn:  async () => {
      const r = await adminApi.getBranches()
      return r.data
    },
    staleTime: 60 * 1000,
  })
}

export function useAuditLog(params?: any) {
  return useQuery({
    queryKey: ['admin', 'audit-log', params],
    queryFn:  async () => {
      const r = await adminApi.getAuditLog(params)
      return r.data.results || r.data
    },
    staleTime: 30 * 1000,
  })
}

export function useSalesReport(params?: any) {
  return useQuery({
    queryKey: ['admin', 'sales-report', params],
    queryFn:  async () => {
      const r = await adminApi.getSalesReport(params)
      return r.data
    },
  })
}

export function useCreateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => adminApi.createUser(data),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['admin'] }),
  })
}

export function useUpdateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      adminApi.updateUser(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin'] }),
  })
}

export function useCreateBranch() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => adminApi.createBranch(data),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['admin'] }),
  })
}

export function useUpdateBranch() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      adminApi.updateBranch(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin'] }),
  })
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (id: number) => adminApi.resetPassword(id),
  })
}