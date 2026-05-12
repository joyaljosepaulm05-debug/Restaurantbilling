'use client'

import { useState } from 'react'
import { Users, GitBranch,
         FileText, BarChart2 } from 'lucide-react'
import { UserManagement }   from './UserManagement'
import { BranchManagement } from './BranchManagement'
import { AuditLog }         from './AuditLog'
import { SalesReport }      from './SalesReport'

const TABS = [
  { id: 'users',    label: 'Staff',    icon: <Users     size={15} /> },
  { id: 'branches', label: 'Branches', icon: <GitBranch size={15} /> },
  { id: 'audit',    label: 'Audit log',icon: <FileText  size={15} /> },
  { id: 'report',   label: 'Sales report', icon: <BarChart2 size={15} /> },
]

export function AdminDashboard() {
  const [tab, setTab] = useState('users')

  return (
    <div className="bg-gray-50 min-h-full">

      {/* Top bar */}
      <div className="bg-white border-b border-gray-200
                      px-6 py-2 flex-shrink-0">
        <div className="flex gap-1">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2
                          rounded-xl text-sm font-medium
                          transition-colors
                ${tab === t.id
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
                }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-6">
        {tab === 'users'    && <UserManagement />}
        {tab === 'branches' && <BranchManagement />}
        {tab === 'audit'    && <AuditLog />}
        {tab === 'report'   && <SalesReport />}
      </main>
    </div>
  )
}