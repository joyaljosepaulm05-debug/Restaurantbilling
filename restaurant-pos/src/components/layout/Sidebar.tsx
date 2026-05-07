'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Receipt, BarChart2, Package,
  Users, UserCheck, LogOut,
  ChevronLeft, ChevronRight,
  Building2
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'

// ── Nav item definition ───────────────────────────────────────
interface NavItem {
  href:    string
  label:   string
  icon:    React.ReactNode
  roles:   string[]          // which roles can see this item
  badge?:  string
}

const NAV_ITEMS: NavItem[] = [
  {
    href:  '/billing',
    label: 'Billing',
    icon:  <Receipt size={18} />,
    roles: ['OWNER', 'MANAGER', 'BILLING', 'INVENTORY'],
  },
  {
    href:  '/inventory',
    label: 'Inventory',
    icon:  <Package size={18} />,
    roles: ['OWNER', 'MANAGER', 'INVENTORY'],
  },
  {
    href:  '/members',
    label: 'Members',
    icon:  <Users size={18} />,
    roles: ['OWNER', 'MANAGER', 'BILLING'],
  },
  {
    href:  '/attendance',
    label: 'Attendance',
    icon:  <UserCheck size={18} />,
    roles: ['OWNER', 'MANAGER'],
  },
  {
    href:  '/analytics',
    label: 'Analytics',
    icon:  <BarChart2 size={18} />,
    roles: ['OWNER'],
  },
]

// ── Role badge colours ────────────────────────────────────────
const ROLE_COLORS: Record<string, string> = {
  OWNER:     'bg-purple-100 text-purple-700',
  MANAGER:   'bg-blue-100   text-blue-700',
  BILLING:   'bg-green-100  text-green-700',
  INVENTORY: 'bg-amber-100  text-amber-700',
}

export function Sidebar() {
  const pathname          = usePathname()
  const router            = useRouter()
  const { user, clearAuth } = useAuthStore()

  // Collapsed state — remembered in localStorage
  const [collapsed, setCollapsed] = useState(false)
  const [mounted,   setMounted]   = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('sidebar_collapsed')
    if (saved === 'true') setCollapsed(true)
  }, [])

  const toggleCollapsed = () => {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem('sidebar_collapsed', String(next))
  }

  const handleLogout = () => {
    clearAuth()
    router.push('/login')
  }

  // Filter nav items by role
  const visibleItems = NAV_ITEMS.filter(
    item => user?.role && item.roles.includes(user.role)
  )

  if (!mounted) return (
    <div className="w-60 h-screen bg-white border-r border-gray-200
                    flex-shrink-0" />
  )

  return (
    <aside className={cn(
      'h-screen bg-white border-r border-gray-200',
      'flex flex-col flex-shrink-0',
      'transition-all duration-200',
      collapsed ? 'w-16' : 'w-60'
    )}>

      {/* ── Logo + collapse toggle ─────────────────────────── */}
      <div className={cn(
        'flex items-center border-b border-gray-200 h-14',
        collapsed ? 'justify-center px-0' : 'justify-between px-4'
      )}>
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-gray-900 rounded-lg
                            flex items-center justify-center
                            flex-shrink-0">
              <Building2 size={14} className="text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-900
                             truncate">
              Restaurant OS
            </span>
          </div>
        )}

        <button
          onClick={toggleCollapsed}
          className={cn(
            'text-gray-400 hover:text-gray-600 hover:bg-gray-100',
            'rounded-lg p-1.5 transition-colors flex-shrink-0',
            collapsed && 'mx-auto'
          )}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed
            ? <ChevronRight size={16} />
            : <ChevronLeft  size={16} />
          }
        </button>
      </div>

      {/* ── Navigation items ──────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {visibleItems.map((item) => {
          const isActive = pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                'flex items-center rounded-xl transition-colors',
                'text-sm font-medium group',
                collapsed
                  ? 'justify-center p-2.5'
                  : 'gap-3 px-3 py-2.5',
                isActive
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              {/* Icon */}
              <span className={cn(
                'flex-shrink-0',
                isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'
              )}>
                {item.icon}
              </span>

              {/* Label (hidden when collapsed) */}
              {!collapsed && (
                <span className="truncate">{item.label}</span>
              )}

              {/* Badge */}
              {!collapsed && item.badge && (
                <span className="ml-auto text-xs bg-red-500
                                 text-white px-1.5 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* ── Branch info ──────────────────────────────────── */}
      {!collapsed && user?.branch_name && (
        <div className="px-4 py-2 border-t border-gray-100">
          <p className="text-xs text-gray-400">Branch</p>
          <p className="text-xs font-medium text-gray-700 truncate">
            {user.branch_name}
          </p>
        </div>
      )}

      {/* ── User section ─────────────────────────────────── */}
      <div className={cn(
        'border-t border-gray-200 flex-shrink-0',
        collapsed ? 'p-2' : 'p-3'
      )}>
        {collapsed ? (
          // Collapsed — just logout icon
          <button
            onClick={handleLogout}
            className="w-full flex justify-center p-2 rounded-xl
                       text-gray-400 hover:text-red-500
                       hover:bg-red-50 transition-colors"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        ) : (
          // Expanded — full user card
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-gray-900
                            flex items-center justify-center
                            flex-shrink-0">
              <span className="text-white text-xs font-semibold">
                {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>

            {/* Name + role */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-900 truncate">
                {user?.full_name}
              </p>
              <span className={cn(
                'text-xs px-1.5 py-0.5 rounded-full font-medium',
                ROLE_COLORS[user?.role || ''] ||
                'bg-gray-100 text-gray-600'
              )}>
                {user?.role}
              </span>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="text-gray-400 hover:text-red-500
                         hover:bg-red-50 p-1.5 rounded-lg
                         transition-colors flex-shrink-0"
              title="Logout"
            >
              <LogOut size={15} />
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}