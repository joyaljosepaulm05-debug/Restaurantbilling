import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User } from '@/types'

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean

  // Actions
  setAuth: (user: User, access: string, refresh: string) => void
  clearAuth: () => void

  // Helpers
  isOwner: () => boolean
  isManager: () => boolean
  isBilling: () => boolean
  canAccessBranch: (branchId: number) => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: (user, access, refresh) => {
        // Save to localStorage (persist middleware handles this)
        localStorage.setItem('access_token', access)
        localStorage.setItem('refresh_token', refresh)
        document.cookie = `access_token=${access}; path=/; max-age=28800; SameSite=Lax`

        set({
          user,
          accessToken: access,
          refreshToken: refresh,
          isAuthenticated: true,
        })
      },

      clearAuth: () => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        document.cookie = 'access_token=; path=/; max-age=0'

        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        })
      },

      // Role helpers
      isOwner: () => get().user?.role === 'OWNER',
      isManager: () =>
        ['OWNER', 'MANAGER'].includes(get().user?.role ?? ''),
      isBilling: () =>
        ['OWNER', 'MANAGER', 'BILLING'].includes(get().user?.role ?? ''),

      // Branch check — owner can access all
      canAccessBranch: (branchId: number) => {
        const user = get().user
        if (!user) return false
        if (user.role === 'OWNER') return true
        return user.branch_id === branchId
      },
    }),
    {
      name: 'restaurant-auth',  // localStorage key
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)