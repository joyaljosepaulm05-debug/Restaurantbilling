import axios from 'axios'
import type {
  MenuItem,
  Member,
  MemberWithBalance,
  MemberStatement,
  CardLookupResponse,
  CreateMemberPayload,
  UpdateMemberPayload,
  TopUpPayload,
} from '@/types';
// Base axios instance — all API calls use this
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ── Request Interceptor ───────────────────────────────────────
// Automatically adds JWT token to every request
// You never manually add Authorization headers
api.interceptors.request.use((config) => {
  // Get token from localStorage
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── Response Interceptor ──────────────────────────────────────
// Handles token expiry automatically
// If 401 received → get new token → retry original request
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Token expired — try refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refresh_token')
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh/`,
          { refresh: refreshToken }
        )

        const newAccessToken = response.data.access
        localStorage.setItem('access_token', newAccessToken)

        // Retry the original request with new token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        return api(originalRequest)

      } catch {
        // Refresh failed → clear everything → redirect to login
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user')
        window.location.href = '/login'
        return Promise.reject(error)
      }
    }

    return Promise.reject(error)
  }
)

export default api


// ── Auth API ──────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login/', { email, password }),

  logout: (refresh: string) =>
    api.post('/auth/logout/', { refresh }),

  me: () =>
    api.get('/auth/me/'),
}


// ── Inventory API ─────────────────────────────────────────────
// Add these to inventoryApi in src/lib/api.ts
export const inventoryApi = {
  pluLookup: (shortCode: string) =>
    api.get(`/inventory/plu/${shortCode}/`),

  getMenu: () =>
    api.get('/inventory/menu/'),

  getItems: (params?: { category?: number; available?: boolean }) =>
    api.get('/inventory/items/', { params }),

  createItem: (data: any) =>
    api.post('/inventory/items/', data),

  updateItem: (id: number, data: any) =>
    api.patch(`/inventory/items/${id}/`, data),

  deleteItem: (id: number) =>
    api.delete(`/inventory/items/${id}/`),

  getCategories: () =>
    api.get('/inventory/categories/'),

  // ← ADD THIS — was missing
  createCategory: (data: { name: string; icon?: string; sort_order?: number }) =>
    api.post('/inventory/categories/', data),

  addStock: (menuItemId: number, quantity: number, note?: string) =>
    api.post('/inventory/stock/add/', {
      menu_item_id: menuItemId,
      quantity,
      note: note || '',
    }),

  getStockLevel: (itemId: number) =>
    api.get(`/inventory/stock/${itemId}/`),
}


// ── Billing API ───────────────────────────────────────────────
export const billingApi = {
  createSale: (data: {
    items: { short_code: string; quantity: number }[]
    customer_name?: string
    table_number?: string
    branch_id?: number
  }) => api.post('/billing/sales/create/', data),

  getSales: (params?: { status?: string; date?: string }) =>
    api.get('/billing/sales/', { params }),

  getSale: (id: number) =>
    api.get(`/billing/sales/${id}/`),

  processPayment: (id: number, payments: {
    method: string
    amount: number
    transaction_ref?: string
  }[]) => api.post(`/billing/sales/${id}/pay/`, { payments }),

  voidSale: (id: number) =>
    api.post(`/billing/sales/${id}/void/`),

  printReceipt: (id: number, previewOnly = false) =>
    api.post(`/billing/sales/${id}/print/`, { preview_only: previewOnly }),
}


// ── Members API ───────────────────────────────────────────────
export const membersApi = {
  getMembers: async (search?: string): Promise<MemberWithBalance[]> => {
    const params = search ? { search } : {};
    const res = await api.get('/members/', { params });
    return res.data;
  },

  getMember: async (id: number): Promise<MemberWithBalance> => {
    const res = await api.get(`/members/${id}/`);
    return res.data;
  },

  createMember: async (data: CreateMemberPayload): Promise<Member> => {
    const res = await api.post('/members/', data);
    return res.data;
  },

  updateMember: async (id: number, data: UpdateMemberPayload): Promise<Member> => {
    const res = await api.patch(`/members/${id}/`, data);
    return res.data;
  },

  lookup: async (cardNumber: string): Promise<CardLookupResponse> => {
    const res = await api.post('/members/lookup/', { card_number: cardNumber });
    return res.data;
  },

  topUp: async (id: number, data: TopUpPayload): Promise<void> => {
    await api.post(`/members/${id}/topup/`, data);
  },

  getStatement: async (id: number): Promise<MemberStatement> => {
    const res = await api.get(`/members/${id}/statement/`);
    return res.data;
  },
};


// ── Analytics API ─────────────────────────────────────────────
export const analyticsApi = {
  getDashboard: (date?: string) =>
    api.get('/analytics/dashboard/', { params: { date } }),

  getTrend: (days = 7, branchId?: number) =>
    api.get('/analytics/trend/', { params: { days, branch_id: branchId } }),

  getTopItems: (days = 7, limit = 10) =>
    api.get('/analytics/top-items/', { params: { days, limit } }),

  getBranchPerformance: () =>
    api.get('/analytics/branches/'),

  getMobileDashboard: () =>
    api.get('/analytics/mobile/'),
}

//----ATTENDANCE
export const attendanceApi = {
  // Register a staff face (manager only)
  registerFace: (userId: number, imageData: string) =>
    api.post('/attendance/register-face/', {
      user_id:    userId,
      image_data: imageData,
    }),

  // Check in/out — NO JWT needed (face is the auth)
  verify: (imageData: string, attendanceType: 'CHECK_IN' | 'CHECK_OUT',
           branchId?: number) =>
    axios.post(`${process.env.NEXT_PUBLIC_API_URL}/attendance/verify/`, {
      image_data:      imageData,
      attendance_type: attendanceType,
      branch_id:       branchId ?? 1,
    }),

  // Today's attendance list
  getToday: (branchId?: number) =>
    api.get('/attendance/today/', {
      params: branchId ? { branch_id: branchId } : {}
    }),

  // Present/absent summary
  getSummary: (branchId?: number, date?: string) =>
    api.get('/attendance/summary/', {
      params: {
        ...(branchId ? { branch_id: branchId } : {}),
        ...(date     ? { date }                : {}),
      }
    }),
}
