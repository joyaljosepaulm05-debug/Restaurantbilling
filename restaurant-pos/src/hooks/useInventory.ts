import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { inventoryApi } from '@/lib/api'

// ── Fetch all menu items ──────────────────────────────────────
export function useMenuItems(categoryId?: number) {
  return useQuery({
    queryKey: ['inventory', 'items', categoryId],
    queryFn: async () => {
      const response = await inventoryApi.getItems(
        categoryId ? { category: categoryId } : undefined
      )
      return response.data
    },
    staleTime: 2 * 60 * 1000,
  })
}

// ── Fetch categories ──────────────────────────────────────────
export function useCategories() {
  return useQuery({
    queryKey: ['inventory', 'categories'],
    queryFn: async () => {
      const response = await inventoryApi.getCategories()
      return response.data
    },
    staleTime: 10 * 60 * 1000,
  })
}

// ── Create menu item ──────────────────────────────────────────
export function useCreateMenuItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: any) => inventoryApi.createItem(data),
    onSuccess: () => {
      // Invalidate cache → table re-fetches automatically
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
    },
  })
}

// ── Update menu item ──────────────────────────────────────────
export function useUpdateMenuItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      inventoryApi.updateItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
    },
  })
}

// ── Toggle availability ───────────────────────────────────────
export function useToggleAvailability() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, isAvailable }: {
      id: number; isAvailable: boolean
    }) => inventoryApi.updateItem(id, { is_available: isAvailable }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
    },
  })
}

// ── Add stock ─────────────────────────────────────────────────
export function useAddStock() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ menuItemId, quantity, note }: {
      menuItemId: number
      quantity: number
      note?: string
    }) => inventoryApi.addStock(menuItemId, quantity, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
    },
  })
}

// ── Get stock level ───────────────────────────────────────────
export function useStockLevel(itemId: number) {
  return useQuery({
    queryKey: ['inventory', 'stock', itemId],
    queryFn: async () => {
      const response = await inventoryApi.getStockLevel(itemId)
      return response.data.stock_level as number
    },
    enabled: !!itemId,
  })
}