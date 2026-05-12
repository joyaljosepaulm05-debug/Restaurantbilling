'use client'

import { useState } from 'react'
import { Search, Plus, Edit2,
         UserCheck, UserX } from 'lucide-react'
import { useAdminUsers, useUpdateUser,
         useAdminBranches }        from '@/hooks/useAdmin'
import { UserFormModal }           from './UserFormModal'
import { formatDate }              from '@/lib/utils'

const ROLE_COLORS: Record<string, string> = {
  OWNER:     'bg-purple-100 text-purple-700',
  MANAGER:   'bg-blue-100   text-blue-700',
  BILLING:   'bg-green-100  text-green-700',
  INVENTORY: 'bg-amber-100  text-amber-700',
}

export function UserManagement() {
  const [search,     setSearch]     = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [branchFilter, setBranchFilter] = useState('')
  const [editUser,   setEditUser]   = useState<any | null>(null)
  const [showForm,   setShowForm]   = useState(false)

  const { data, isLoading, refetch } = useAdminUsers({
    search:     search   || undefined,
    role:       roleFilter   || undefined,
    branch:     branchFilter || undefined,
  })

  const { data: branchData } = useAdminBranches()
  const branches = branchData?.branches || []
  const users    = data?.users          || []

  const updateUser = useUpdateUser()

  const toggleActive = async (user: any) => {
    await updateUser.mutateAsync({
      id:   user.id,
      data: { is_active: !user.is_active },
    })
    refetch()
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2
                                        -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name or email..."
            className="w-full pl-8 pr-4 py-2 border border-gray-300
                       rounded-xl text-sm focus:outline-none
                       focus:ring-2 focus:ring-gray-900"
          />
        </div>

        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="border border-gray-300 rounded-xl px-3 py-2
                     text-sm focus:outline-none bg-white
                     focus:ring-2 focus:ring-gray-900"
        >
          <option value="">All roles</option>
          {['OWNER','MANAGER','BILLING','INVENTORY'].map(r => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>

        <select
          value={branchFilter}
          onChange={e => setBranchFilter(e.target.value)}
          className="border border-gray-300 rounded-xl px-3 py-2
                     text-sm focus:outline-none bg-white
                     focus:ring-2 focus:ring-gray-900"
        >
          <option value="">All branches</option>
          {branches.map((b: any) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>

        <button
          onClick={() => { setEditUser(null); setShowForm(true) }}
          className="flex items-center gap-1.5 bg-gray-900
                     text-white text-sm font-medium px-4 py-2
                     rounded-xl hover:bg-gray-800 transition-colors
                     flex-shrink-0"
        >
          <Plus size={14} />
          Add staff
        </button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-7 h-7 border-2 border-gray-900
                          border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border
                        border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                {['Staff member', 'Role', 'Branch',
                  'Bills', 'Joined', 'Status', ''].map(h => (
                  <th key={h}
                      className="text-left text-xs font-medium
                                 text-gray-500 uppercase tracking-wider
                                 px-4 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u: any) => (
                <tr key={u.id}
                    className="hover:bg-gray-50 transition-colors">

                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gray-900
                                      flex items-center justify-center
                                      flex-shrink-0">
                        <span className="text-white text-xs font-medium">
                          {u.full_name?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {u.full_name}
                        </p>
                        <p className="text-xs text-gray-500">{u.email}</p>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full
                                      font-medium
                      ${ROLE_COLORS[u.role] ||
                        'bg-gray-100 text-gray-600'}`}>
                      {u.role}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-600">
                      {u.branch_name || 'All branches'}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-gray-900">
                      {u.bills_count}
                    </span>
                    <span className="text-xs text-gray-400 ml-1">
                      bills
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-500">
                      {formatDate(u.date_joined)}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full
                                      font-medium
                      ${u.is_active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100  text-red-600'}`}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditUser(u)
                          setShowForm(true)
                        }}
                        className="p-1.5 rounded-lg hover:bg-gray-100
                                   text-gray-500 hover:text-gray-700
                                   transition-colors"
                        title="Edit"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => toggleActive(u)}
                        className={`p-1.5 rounded-lg transition-colors
                          ${u.is_active
                            ? 'hover:bg-red-50 text-gray-400 hover:text-red-500'
                            : 'hover:bg-green-50 text-gray-400 hover:text-green-500'
                          }`}
                        title={u.is_active
                          ? 'Deactivate' : 'Activate'}
                      >
                        {u.is_active
                          ? <UserX    size={13} />
                          : <UserCheck size={13} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {users.length === 0 && (
                <tr>
                  <td colSpan={7}
                      className="px-4 py-12 text-center text-sm
                                 text-gray-400">
                    No staff members found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <UserFormModal
        isOpen={showForm}
        user={editUser}
        onClose={() => { setShowForm(false); setEditUser(null) }}
      />
    </div>
  )
}