"use client";

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { authApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

export default function LoginPage() {
  const router = useRouter()
  const { setAuth } = useAuthStore()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const passwordRef = useRef<HTMLInputElement>(null)

const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault()
  setError('')
  setLoading(true)

  try {
    const response = await authApi.login(email, password)
    const { access, refresh, user } = response.data

    // Save to zustand store + localStorage
    setAuth(user, access, refresh)

    // ← ADD THIS: also save to cookie so middleware can read it
    document.cookie = `access_token=${access}; path=/; max-age=28800; SameSite=Lax`

    // Redirect based on role
    const from = new URLSearchParams(window.location.search).get('from')
    if (from) {
      router.push(from)
    } else if (user.role === 'OWNER') {
      router.push('/analytics')
    } else {
      router.push('/billing')
    }

  } catch (err: any) {
    setError(
      err.response?.data?.detail?.detail ||
      err.response?.data?.detail ||
      'Login failed. Check your credentials.'
    )
  } finally {
    setLoading(false)
  }
}
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 w-full max-w-sm p-8">

        {/* Logo area */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-gray-900 rounded-xl mx-auto mb-4
                          flex items-center justify-content-center">
            <span className="text-white text-xl font-bold
                             flex items-center justify-center w-full h-full">
              R
            </span>
          </div>
          <h1 className="text-xl font-medium text-gray-900">
            Restaurant OS
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Sign in to your account
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700
                          rounded-lg p-3 text-sm mb-4">
            {error}
          </div>
        )}

        {/* Login form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => {
                // Tab → jump to password field
                if (e.key === 'Tab') {
                  e.preventDefault()
                  passwordRef.current?.focus()
                }
              }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2
                         text-sm focus:outline-none focus:ring-2
                         focus:ring-gray-900 focus:border-transparent"
              placeholder="owner@restaurant.com"
              autoFocus
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              ref={passwordRef}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2
                         text-sm focus:outline-none focus:ring-2
                         focus:ring-gray-900 focus:border-transparent"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-900 text-white rounded-lg py-2.5
                       text-sm font-medium hover:bg-gray-800
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        {/* Role badges — for development reference */}
        <div className="mt-6 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-400 text-center mb-2">
            Test accounts
          </p>
          <div className="flex gap-2 flex-wrap justify-center">
            {['OWNER', 'MANAGER', 'BILLING'].map((role) => (
              <span
                key={role}
                className="text-xs bg-gray-100 text-gray-600
                           px-2 py-1 rounded-full"
              >
                {role}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}