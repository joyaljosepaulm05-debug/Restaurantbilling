'use client'

import { useState } from 'react'
import { Plus, Edit2, MapPin,
         Users, TrendingUp }    from 'lucide-react'
import { useAdminBranches }     from '@/hooks/useAdmin'
import { BranchFormModal }      from './BranchFormModal'
import { toMoney }              from '@/lib/utils'

export function BranchManagement() {
  const [editBranch, setEditBranch] = useState<any | null>(null)
  const [showForm,   setShowForm]   = useState(false)

  const { data, isLoading } = useAdminBranches()
  const branches = data?.branches || []

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-gray-500">
          {branches.length} branch{branches.length !== 1 ? 'es' : ''}
        </p>
        <button
          onClick={() => { setEditBranch(null); setShowForm(true) }}
          className="flex items-center gap-1.5 bg-gray-900 text-white
                     text-sm font-medium px-4 py-2 rounded-xl
                     hover:bg-gray-800 transition-colors"
        >
          <Plus size={14} />
          Add branch
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-7 h-7 border-2 border-gray-900
                          border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {branches.map((b: any) => (
            <div key={b.id}
                 className="bg-white rounded-2xl border
                            border-gray-200 p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-900
                                  flex items-center justify-center
                                  flex-shrink-0">
                    <span className="text-white text-sm font-semibold">
                      B{b.id}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-gray-900">
                        {b.name}
                      </h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full
                                        font-medium
                        ${b.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100  text-red-600'}`}>
                        {b.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    {b.address && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <MapPin size={11} className="text-gray-400" />
                        <p className="text-xs text-gray-500">
                          {b.address}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setEditBranch(b)
                    setShowForm(true)
                  }}
                  className="p-1.5 rounded-lg hover:bg-gray-100
                             text-gray-500 hover:text-gray-700
                             transition-colors"
                >
                  <Edit2 size={14} />
                </button>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3 mt-4 pt-4
                              border-t border-gray-100">
                <div className="text-center">
                  <div className="flex items-center justify-center
                                  gap-1 mb-1">
                    <Users size={13} className="text-gray-400" />
                    <p className="text-xs text-gray-500">Staff</p>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">
                    {b.staff_count}
                  </p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center
                                  gap-1 mb-1">
                    <TrendingUp size={13} className="text-gray-400" />
                    <p className="text-xs text-gray-500">Today</p>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">
                    ₹{toMoney(b.today_revenue)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">Manager</p>
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {b.manager_name}
                  </p>
                </div>
              </div>

              {b.phone && (
                <p className="text-xs text-gray-400 mt-3">
                  📞 {b.phone}
                </p>
              )}
            </div>
          ))}

          {branches.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <p className="text-sm">No branches yet.</p>
            </div>
          )}
        </div>
      )}

      <BranchFormModal
        isOpen={showForm}
        branch={editBranch}
        onClose={() => { setShowForm(false); setEditBranch(null) }}
      />
    </div>
  )
}