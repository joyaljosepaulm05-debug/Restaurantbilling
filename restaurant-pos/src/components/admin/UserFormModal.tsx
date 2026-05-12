'use client'

import { useState, useEffect } from 'react'
import { X, Copy, Check } from 'lucide-react'
import { useCreateUser, useUpdateUser,
         useResetPassword, useAdminBranches } from '@/hooks/useAdmin'

interface UserFormModalProps {
  isOpen:  boolean
  user?:   any | null
  onClose: () => void
}

const ROLES = ['OWNER','MANAGER','BILLING','INVENTORY']

export function UserFormModal({ isOpen, user, onClose }: UserFormModalProps) {
  const isEditing = !!user
  const { data: branchData } = useAdminBranches()
  const branches = branchData?.branches || []

  const createUser   = useCreateUser()
  const updateUser   = useUpdateUser()
  const resetPw      = useResetPassword()

  const [form, setForm] = useState({
    email: '', full_name: '', phone: '',
    role: 'BILLING', branch: '', is_active: true,
  })
  const [error,   setError]   = useState('')
  const [tempPw,  setTempPw]  = useState('')
  const [copied,  setCopied]  = useState(false)

  useEffect(() => {
    if (user) {
      setForm({
        email:     user.email     || '',
        full_name: user.full_name || '',
        phone:     user.phone     || '',
        role:      user.role      || 'BILLING',
        branch:    user.branch    ? String(user.branch) : '',
        is_active: user.is_active ?? true,
      })
    } else {
      setForm({ email:'', full_name:'', phone:'',
                role:'BILLING', branch:'', is_active:true })
    }
    setError('')
    setTempPw('')
  }, [user, isOpen])

  const set = (k: string, v: any) =>
    setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const payload: any = {
      email:     form.email,
      full_name: form.full_name,
      phone:     form.phone,
      role:      form.role,
      is_active: form.is_active,
    }
    if (form.branch) payload.branch = parseInt(form.branch)

    try {
      if (isEditing) {
        await updateUser.mutateAsync({ id: user.id, data: payload })
        onClose()
      } else {
        const r = await createUser.mutateAsync(payload)
        setTempPw(r.data.temp_password)
      }
    } catch (err: any) {
      setError(
        err.response?.data?.errors?.email?.[0] ||
        err.response?.data?.detail ||
        'Failed to save user.'
      )
    }
  }

  const handleResetPw = async () => {
    if (!user) return
    try {
      const r = await resetPw.mutateAsync(user.id)
      setTempPw(r.data.temp_password)
    } catch {
      setError('Failed to reset password.')
    }
  }

  const copyPw = () => {
    navigator.clipboard.writeText(tempPw)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!isOpen) return null

  const loading = createUser.isPending || updateUser.isPending

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center
                    justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl
                      flex flex-col max-h-[90vh]">

        <div className="flex items-center justify-between p-5
                        border-b border-gray-200 flex-shrink-0">
          <h2 className="text-sm font-semibold text-gray-900">
            {isEditing ? 'Edit staff member' : 'Add staff member'}
          </h2>
          <button onClick={onClose}
                  className="text-gray-400 hover:text-gray-600
                             p-1 rounded-lg hover:bg-gray-100">
            <X size={16} />
          </button>
        </div>

        {/* Temp password success screen */}
        {tempPw ? (
          <div className="p-6 flex flex-col items-center gap-4">
            <div className="w-12 h-12 bg-green-50 rounded-full
                            flex items-center justify-center">
              <Check size={22} className="text-green-600" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-900 mb-1">
                {isEditing ? 'Password reset!' : 'User created!'}
              </p>
              <p className="text-xs text-gray-500">
                Share this temporary password securely.
                It will not be shown again.
              </p>
            </div>
            <div className="w-full bg-gray-50 rounded-xl p-4
                            flex items-center justify-between
                            border border-gray-200">
              <code className="text-base font-mono font-semibold
                               text-gray-900 tracking-wider">
                {tempPw}
              </code>
              <button onClick={copyPw}
                      className="text-gray-400 hover:text-gray-700
                                 p-1.5 rounded-lg hover:bg-gray-200
                                 transition-colors">
                {copied
                  ? <Check size={15} className="text-green-600" />
                  : <Copy size={15} />}
              </button>
            </div>
            <button
              onClick={() => { setTempPw(''); onClose() }}
              className="w-full bg-gray-900 text-white rounded-xl
                         py-2.5 text-sm font-medium hover:bg-gray-800"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}
                className="p-5 space-y-3 overflow-y-auto flex-1">

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium
                                  text-gray-700 mb-1">
                  Full name *
                </label>
                <input
                  type="text"
                  value={form.full_name}
                  onChange={e => set('full_name', e.target.value)}
                  required
                  placeholder="Priya Nair"
                  className="w-full border border-gray-300 rounded-lg
                             px-3 py-2 text-sm focus:outline-none
                             focus:ring-2 focus:ring-gray-900"
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
                  placeholder="9876543210"
                  className="w-full border border-gray-300 rounded-lg
                             px-3 py-2 text-sm focus:outline-none
                             focus:ring-2 focus:ring-gray-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium
                                text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                required
                disabled={isEditing}
                placeholder="priya@restaurant.com"
                className="w-full border border-gray-300 rounded-lg
                           px-3 py-2 text-sm focus:outline-none
                           focus:ring-2 focus:ring-gray-900
                           disabled:bg-gray-50 disabled:text-gray-500"
              />
              {isEditing && (
                <p className="text-xs text-gray-400 mt-0.5">
                  Email cannot be changed after creation
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium
                                  text-gray-700 mb-1">
                  Role *
                </label>
                <select
                  value={form.role}
                  onChange={e => set('role', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg
                             px-3 py-2 text-sm focus:outline-none
                             focus:ring-2 focus:ring-gray-900 bg-white"
                >
                  {ROLES.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium
                                  text-gray-700 mb-1">
                  Branch
                </label>
                <select
                  value={form.branch}
                  onChange={e => set('branch', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg
                             px-3 py-2 text-sm focus:outline-none
                             focus:ring-2 focus:ring-gray-900 bg-white"
                >
                  <option value="">
                    All branches (Owner)
                  </option>
                  {branches.map((b: any) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {isEditing && (
              <div className="flex items-center justify-between
                              py-3 px-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Active
                  </p>
                  <p className="text-xs text-gray-500">
                    Inactive users cannot log in
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => set('is_active', !form.is_active)}
                  className={`relative w-10 h-6 rounded-full
                              transition-colors
                    ${form.is_active ? 'bg-gray-900' : 'bg-gray-300'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white
                                   rounded-full transition-transform
                                   shadow-sm
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

            <div className="flex gap-2 pt-1">
              {isEditing && (
                <button
                  type="button"
                  onClick={handleResetPw}
                  disabled={resetPw.isPending}
                  className="flex-1 py-2.5 rounded-xl border
                             border-gray-300 text-sm font-medium
                             text-gray-700 hover:bg-gray-50
                             disabled:opacity-40 transition-colors"
                >
                  {resetPw.isPending ? 'Resetting...' : 'Reset password'}
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                className="flex-[2] bg-gray-900 text-white
                           rounded-xl py-2.5 text-sm font-medium
                           hover:bg-gray-800 disabled:opacity-40
                           transition-colors"
              >
                {loading
                  ? 'Saving...'
                  : isEditing ? 'Save changes' : 'Create staff member'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}