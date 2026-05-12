'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useCreateBranch, useUpdateBranch } from '@/hooks/useAdmin'

interface BranchFormModalProps {
  isOpen:  boolean
  branch?: any | null
  onClose: () => void
}

export function BranchFormModal({
  isOpen, branch, onClose
}: BranchFormModalProps) {
  const isEditing   = !!branch
  const createBranch = useCreateBranch()
  const updateBranch = useUpdateBranch()

  const [form, setForm] = useState({
    name: '', address: '', phone: '', is_active: true
  })
  const [error, setError] = useState('')

  useEffect(() => {
    if (branch) {
      setForm({
        name:      branch.name      || '',
        address:   branch.address   || '',
        phone:     branch.phone     || '',
        is_active: branch.is_active ?? true,
      })
    } else {
      setForm({ name:'', address:'', phone:'', is_active: true })
    }
    setError('')
  }, [branch, isOpen])

  const set = (k: string, v: any) =>
    setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      if (isEditing) {
        await updateBranch.mutateAsync({ id: branch.id, data: form })
      } else {
        await createBranch.mutateAsync(form)
      }
      onClose()
    } catch (err: any) {
      setError(
        err.response?.data?.name?.[0] ||
        err.response?.data?.detail ||
        'Failed to save branch.'
      )
    }
  }

  if (!isOpen) return null
  const loading = createBranch.isPending || updateBranch.isPending

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center
                    justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl">

        <div className="flex items-center justify-between p-5
                        border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900">
            {isEditing ? 'Edit branch' : 'Add branch'}
          </h2>
          <button onClick={onClose}
                  className="text-gray-400 hover:text-gray-600
                             p-1 rounded-lg hover:bg-gray-100">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div>
            <label className="block text-xs font-medium
                              text-gray-700 mb-1">
              Branch name *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              required
              placeholder="e.g. Kochi Branch"
              className="w-full border border-gray-300 rounded-lg
                         px-3 py-2 text-sm focus:outline-none
                         focus:ring-2 focus:ring-gray-900"
            />
          </div>

          <div>
            <label className="block text-xs font-medium
                              text-gray-700 mb-1">
              Address
            </label>
            <textarea
              value={form.address}
              onChange={e => set('address', e.target.value)}
              rows={2}
              placeholder="MG Road, Kochi, Kerala"
              className="w-full border border-gray-300 rounded-lg
                         px-3 py-2 text-sm focus:outline-none
                         focus:ring-2 focus:ring-gray-900 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium
                              text-gray-700 mb-1">
              Phone
            </label>
            <input
              type="text"
              value={form.phone}
              onChange={e => set('phone', e.target.value)}
              placeholder="0484-567890"
              className="w-full border border-gray-300 rounded-lg
                         px-3 py-2 text-sm focus:outline-none
                         focus:ring-2 focus:ring-gray-900"
            />
          </div>

          {isEditing && (
            <div className="flex items-center justify-between
                            py-2.5 px-3 bg-gray-50 rounded-xl">
              <p className="text-sm font-medium text-gray-900">
                Active
              </p>
              <button
                type="button"
                onClick={() => set('is_active', !form.is_active)}
                className={`relative w-10 h-6 rounded-full
                            transition-colors
                  ${form.is_active ? 'bg-gray-900' : 'bg-gray-300'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white
                                 rounded-full transition-transform shadow-sm
                  ${form.is_active
                    ? 'translate-x-5' : 'translate-x-1'}`}
                />
              </button>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200
                            text-red-700 rounded-xl p-3 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-900 text-white rounded-xl
                       py-2.5 text-sm font-medium hover:bg-gray-800
                       disabled:opacity-40 transition-colors"
          >
            {loading
              ? 'Saving...'
              : isEditing ? 'Save changes' : 'Create branch'}
          </button>
        </form>
      </div>
    </div>
  )
}