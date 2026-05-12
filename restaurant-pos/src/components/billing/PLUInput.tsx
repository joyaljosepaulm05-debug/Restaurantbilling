'use client'

import { useState, useEffect } from 'react'
import { usePLULookup }        from '@/hooks/usePLULookup'
import { Search, Check, X, Loader2 } from 'lucide-react'

interface PLUInputProps {
  onItemAdded?: () => void
  disabled?:    boolean
  inputRef?:    React.RefObject<HTMLInputElement>
  tabId?:       string   // re-focus when tab changes
}

export function PLUInput({
  onItemAdded, disabled, inputRef, tabId
}: PLUInputProps) {
  const [value, setValue] = useState('')
  const { state, lastFound, errorMsg, lookup } = usePLULookup()

  // Clear and refocus when tab switches
  useEffect(() => {
    setValue('')
    if (!disabled) inputRef?.current?.focus()
  }, [tabId])

  useEffect(() => {
    if (!disabled && state === 'idle') {
      inputRef?.current?.focus()
    }
  }, [disabled, state])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && value.trim()) {
      e.preventDefault()
      lookup(value.trim())
      setValue('')
      onItemAdded?.()
    }
    if (e.key === 'Escape') setValue('')
  }

  const config = {
    idle:      { border: 'border-gray-300', icon: <Search  size={18} className="text-gray-400" />, bg: 'bg-white' },
    searching: { border: 'border-blue-400',  icon: <Loader2 size={18} className="text-blue-500 animate-spin" />, bg: 'bg-blue-50' },
    found:     { border: 'border-green-400', icon: <Check   size={18} className="text-green-500" />, bg: 'bg-green-50' },
    not_found: { border: 'border-red-400',   icon: <X       size={18} className="text-red-500" />, bg: 'bg-red-50' },
    error:     { border: 'border-red-400',   icon: <X       size={18} className="text-red-500" />, bg: 'bg-red-50' },
  }[state]

  return (
    <div className="w-full">
      <div className={`flex items-center gap-3 border-2 rounded-xl
                       px-4 py-3 transition-all duration-150
                       ${config.border} ${config.bg}
                       ${disabled ? 'opacity-50' : ''}`}>
        <div className="flex-shrink-0">{config.icon}</div>

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={e => setValue(e.target.value.toUpperCase())}
          onKeyDown={handleKeyDown}
          disabled={disabled || state === 'searching'}
          placeholder="PLU code → Enter  (e.g. CB1, TEA, PR1)"
          className="flex-1 bg-transparent outline-none text-lg
                     font-mono tracking-widest placeholder:font-sans
                     placeholder:tracking-normal placeholder:text-sm
                     placeholder:text-gray-400 text-gray-900"
          autoComplete="off"
          spellCheck={false}
        />

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <kbd className="text-xs text-gray-400 border border-gray-200
                          rounded px-1.5 py-0.5">Enter</kbd>
          <kbd className="text-xs text-gray-400 border border-gray-200
                          rounded px-1.5 py-0.5">Esc clears</kbd>
        </div>
      </div>

      <div className="h-5 mt-1 px-1">
        {state === 'found' && lastFound && (
          <p className="text-xs text-green-600 font-medium">
            ✓ {lastFound.name} — ₹{lastFound.total.toFixed(2)} added
          </p>
        )}
        {(state === 'not_found' || state === 'error') && (
          <p className="text-xs text-red-600">{errorMsg}</p>
        )}
        {state === 'idle' && (
          <p className="text-xs text-gray-400">
            ↑↓ row · +/- qty · Del remove ·
            F2 name · F3 table · F12 pay ·
            Ctrl+T new tab · Ctrl+1-9 switch tab
          </p>
        )}
      </div>
    </div>
  )
}