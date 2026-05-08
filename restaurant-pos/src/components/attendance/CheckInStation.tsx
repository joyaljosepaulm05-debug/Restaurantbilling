'use client'

import { useState } from 'react'
import { Camera, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { attendanceApi } from '@/lib/api'

type StationState = 'idle' | 'loading' | 'success' | 'failed'

interface CheckInResult {
  full_name:       string
  attendance_type: string
  status:          string
  confidence:      string
  timestamp:       string
}

export function CheckInStation() {
  const [state,     setState]     = useState<StationState>('idle')
  const [result,    setResult]    = useState<CheckInResult | null>(null)
  const [error,     setError]     = useState('')
  const [imageData, setImageData] = useState<string | null>(null)
  const [mode,      setMode]      = useState<'CHECK_IN' | 'CHECK_OUT'>('CHECK_IN')

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (ev) => {
      const data = ev.target?.result as string
      setImageData(data)
      await processCheckIn(data)
    }
    reader.readAsDataURL(file)
  }

  const processCheckIn = async (data: string) => {
    setState('loading')
    setError('')
    setResult(null)

    try {
      const response = await attendanceApi.verify(data, mode, 1)
      const res      = response.data

      if (res.success) {
        setState('success')
        setResult(res)
        // Auto-reset after 4 seconds
        setTimeout(() => {
          setState('idle')
          setResult(null)
          setImageData(null)
        }, 4000)
      } else {
        setState('failed')
        setError(res.message || 'Face not recognized.')
        setTimeout(() => {
          setState('idle')
          setError('')
          setImageData(null)
        }, 3000)
      }
    } catch (err: any) {
      setState('failed')
      setError(
        err.response?.data?.error ||
        'Could not process. Try again.'
      )
      setTimeout(() => {
        setState('idle')
        setError('')
        setImageData(null)
      }, 3000)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 bg-gray-900 rounded-xl flex
                        items-center justify-center">
          <Camera size={18} className="text-white" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900">
            Check-in station
          </h3>
          <p className="text-xs text-gray-500">
            Upload photo to mark attendance
          </p>
        </div>
      </div>

      {/* Mode toggle */}
      <div className="flex bg-gray-100 rounded-xl p-1 mb-5">
        {(['CHECK_IN', 'CHECK_OUT'] as const).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 py-2 rounded-lg text-xs font-medium
                        transition-colors
              ${mode === m
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            {m === 'CHECK_IN' ? 'Check in' : 'Check out'}
          </button>
        ))}
      </div>

      {/* States */}
      {state === 'idle' && (
        <label className="block cursor-pointer">
          <div className="h-40 border-2 border-dashed border-gray-300
                          rounded-2xl flex flex-col items-center
                          justify-center gap-3 text-gray-400
                          hover:border-gray-900 hover:text-gray-900
                          transition-colors">
            <Camera size={28} />
            <div className="text-center">
              <p className="text-sm font-medium">
                Upload face photo
              </p>
              <p className="text-xs mt-0.5">
                JPG or PNG, clear frontal face
              </p>
            </div>
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      )}

      {state === 'loading' && (
        <div className="h-40 flex flex-col items-center justify-center
                        gap-3 text-gray-500">
          <Loader2 size={28} className="animate-spin text-gray-900" />
          <p className="text-sm">Identifying face...</p>
        </div>
      )}

      {state === 'success' && result && (
        <div className="h-40 flex flex-col items-center justify-center
                        gap-3 bg-green-50 rounded-2xl">
          <CheckCircle size={32} className="text-green-600" />
          <div className="text-center">
            <p className="text-base font-semibold text-green-800">
              {result.full_name}
            </p>
            <p className="text-sm text-green-600">
              {result.attendance_type === 'CHECK_IN'
                ? '✓ Checked in'
                : '✓ Checked out'}
              {result.status === 'LATE' && (
                <span className="text-amber-600 ml-1">(Late)</span>
              )}
            </p>
            <p className="text-xs text-green-500 mt-1">
              Confidence: {result.confidence}
            </p>
          </div>
        </div>
      )}

      {state === 'failed' && (
        <div className="h-40 flex flex-col items-center justify-center
                        gap-3 bg-red-50 rounded-2xl">
          <XCircle size={32} className="text-red-500" />
          <div className="text-center">
            <p className="text-sm font-semibold text-red-700">
              Not recognized
            </p>
            <p className="text-xs text-red-500 mt-1">
              {error}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}