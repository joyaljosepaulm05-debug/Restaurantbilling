'use client'

import { useState, useRef } from 'react'
import { X, Camera, Upload, CheckCircle } from 'lucide-react'
import { useRegisterFace } from '@/hooks/useAttendance'

interface RegisterFaceModalProps {
  isOpen:  boolean
  onClose: () => void
  users:   { id: number; full_name: string; role: string }[]
}

export function RegisterFaceModal({
  isOpen, onClose, users
}: RegisterFaceModalProps) {
  const [selectedUserId, setSelectedUserId] = useState<number | ''>('')
  const [imagePreview,   setImagePreview]   = useState<string | null>(null)
  const [imageData,      setImageData]      = useState<string | null>(null)
  const [error,          setError]          = useState('')
  const [success,        setSuccess]        = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const registerFace = useRegisterFace()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.')
      return
    }

    const reader = new FileReader()
    reader.onload = (ev) => {
      const result = ev.target?.result as string
      setImagePreview(result)
      setImageData(result)   // full base64 including data URI prefix
      setError('')
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async () => {
    if (!selectedUserId) { setError('Please select a staff member.'); return }
    if (!imageData)      { setError('Please upload a photo.');        return }

    setError('')

    try {
      await registerFace.mutateAsync({
        userId:    Number(selectedUserId),
        imageData: imageData,
      })
      setSuccess('Face registered successfully!')
      setTimeout(() => {
        setSuccess('')
        setImagePreview(null)
        setImageData(null)
        setSelectedUserId('')
        onClose()
      }, 2000)
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
        err.response?.data?.detail ||
        'Failed to register face. Make sure the photo is clear.'
      )
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center
                    justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">

        {/* Header */}
        <div className="flex items-center justify-between p-5
                        border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-900 rounded-lg flex
                            items-center justify-center">
              <Camera size={15} className="text-white" />
            </div>
            <h2 className="text-sm font-semibold text-gray-900">
              Register face
            </h2>
          </div>
          <button onClick={onClose}
                  className="text-gray-400 hover:text-gray-600
                             p-1 rounded-lg hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">

          {/* Staff selector */}
          <div>
            <label className="block text-xs font-medium
                              text-gray-700 mb-1">
              Select staff member *
            </label>
            <select
              value={selectedUserId}
              onChange={e => setSelectedUserId(
                e.target.value ? Number(e.target.value) : ''
              )}
              className="w-full border border-gray-300 rounded-xl
                         px-3 py-2.5 text-sm focus:outline-none
                         focus:ring-2 focus:ring-gray-900 bg-white"
            >
              <option value="">Choose staff member</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.full_name} — {u.role}
                </option>
              ))}
            </select>
          </div>

          {/* Photo upload */}
          <div>
            <label className="block text-xs font-medium
                              text-gray-700 mb-1">
              Clear frontal photo *
            </label>

            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-xl
                             border border-gray-200"
                />
                <button
                  onClick={() => {
                    setImagePreview(null)
                    setImageData(null)
                  }}
                  className="absolute top-2 right-2 bg-white
                             rounded-full p-1 shadow-sm border
                             border-gray-200 text-gray-500
                             hover:text-red-500"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full h-36 border-2 border-dashed
                           border-gray-300 rounded-xl flex flex-col
                           items-center justify-center gap-2
                           text-gray-400 hover:border-gray-400
                           hover:text-gray-600 transition-colors"
              >
                <Upload size={20} />
                <span className="text-sm">
                  Click to upload photo
                </span>
                <span className="text-xs">
                  JPG, PNG — clear frontal face
                </span>
              </button>
            )}

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Tips */}
          <div className="bg-blue-50 rounded-xl p-3">
            <p className="text-xs font-medium text-blue-800 mb-1">
              Photo requirements
            </p>
            <ul className="text-xs text-blue-700 space-y-0.5">
              <li>• Clear frontal face, no obstructions</li>
              <li>• Good lighting, no shadows on face</li>
              <li>• Only one person in the photo</li>
              <li>• No sunglasses or hats</li>
            </ul>
          </div>

          {/* Error / Success */}
          {error && (
            <div className="bg-red-50 border border-red-200
                            text-red-700 rounded-xl p-3 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200
                            text-green-700 rounded-xl p-3 text-sm
                            flex items-center gap-2">
              <CheckCircle size={16} />
              {success}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={registerFace.isPending || !selectedUserId || !imageData}
            className="w-full bg-gray-900 text-white rounded-xl
                       py-3 text-sm font-medium hover:bg-gray-800
                       disabled:opacity-40 transition-colors"
          >
            {registerFace.isPending
              ? 'Registering...'
              : 'Register face'}
          </button>
        </div>
      </div>
    </div>
  )
}