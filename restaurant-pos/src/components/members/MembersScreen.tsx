'use client'

import { useState, useEffect } from 'react'
import { MemberList }     from './MemberList'
import { MemberDetail }   from './MemberDetail'
import { NewMemberModal } from './Modals'
import { useAuthStore }   from '@/store/authStore'

export function MembersScreen() {
  const [selectedId,    setSelectedId]    = useState<number | null>(null)
  const [showNewModal,  setShowNewModal]  = useState(false)
  const [mounted,       setMounted]       = useState(false)
  const { isManager }                     = useAuthStore()

  useEffect(() => { setMounted(true) }, [])

  return (
    <div className="flex h-full bg-gray-50">

      {/* ── Left panel — member list ─────────────────────── */}
      <div className="w-80 flex-shrink-0 border-r border-gray-200
                      bg-white flex flex-col">
        <div className="flex items-center justify-between
                        px-4 py-3 border-b border-gray-200
                        flex-shrink-0">
          <span className="text-sm font-medium text-gray-900">
            Members
          </span>
          {mounted && isManager() && (
            <button
              onClick={() => setShowNewModal(true)}
              className="flex items-center gap-1 px-3 py-1.5
                         rounded-lg bg-blue-600 text-white
                         text-xs font-medium hover:bg-blue-700
                         transition-colors"
            >
              + New member
            </button>
          )}
        </div>

        <MemberList
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      </div>

      {/* ── Right panel — member detail ──────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedId ? (
          <MemberDetail
            memberId={selectedId}
            onDeselect={() => setSelectedId(null)}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center
                          justify-center text-gray-400 gap-2">
            <svg className="w-12 h-12 opacity-30" fill="none"
                 viewBox="0 0 24 24" stroke="currentColor"
                 strokeWidth={1} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round"
                    d="M15 9a3 3 0 11-6 0 3 3 0 016 0zm-9 9a6 6 0 0112 0" />
            </svg>
            <p className="text-sm">
              Select a member to view details
            </p>
          </div>
        )}
      </div>

      {showNewModal && (
        <NewMemberModal
          onClose={() => setShowNewModal(false)}
          onCreated={(id) => {
            setShowNewModal(false)
            setSelectedId(id)
          }}
        />
      )}
    </div>
  )
}