'use client'

import { useState, useRef, useEffect } from 'react'
import { usePLULookup } from '@/hooks/usePLULookup'
import { Search, Check, X, Loader2 } from 'lucide-react'

interface PLUInputProps {
  onItemAdded?: () => void
  disabled?: boolean
}

export function PLUInput({ onItemAdded, disabled }: PLUInputProps) {
  const [value, setValue]       = useState('')
  const inputRef                = useRef<HTMLInputElement>(null)
  const { state, lastFound, errorMsg, lookup } = usePLULookup()

  // Always keep focus on this input
  // The billing screen should ALWAYS be ready for PLU input
  useEffect(() => {
    if (!disabled) {
      inputRef.current?.focus()
    }
  }, [disabled, state])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && value.trim()) {
      e.preventDefault()
      lookup(value.trim())
      setValue('')          // Clear immediately for next input
      onItemAdded?.()
    }

    if (e.key === 'Escape') {
      setValue('')
      setState('idle')
    }
  }

  // Status indicator config
  const statusConfig = {
    idle: {
      border: 'border-gray-300',
      icon: <Search size={18} className="text-gray-400" />,
      bg: 'bg-white',
    },
    searching: {
      border: 'border-blue-400',
      icon: <Loader2 size={18} className="text-blue-500 animate-spin" />,
      bg: 'bg-blue-50',
    },
    found: {
      border: 'border-green-400',
      icon: <Check size={18} className="text-green-500" />,
      bg: 'bg-green-50',
    },
    not_found: {
      border: 'border-red-400',
      icon: <X size={18} className="text-red-500" />,
      bg: 'bg-red-50',
    },
    error: {
      border: 'border-red-400',
      icon: <X size={18} className="text-red-500" />,
      bg: 'bg-red-50',
    },
  }

  const config = statusConfig[state]

  // Dummy setState for escape key (hook manages its own state)
  function setState(_: any) {}

  return (
    <div className="w-full">
      <div className={`
        flex items-center gap-3 border-2 rounded-xl px-4 py-3
        transition-all duration-150
        ${config.border} ${config.bg}
        ${disabled ? 'opacity-50' : ''}
      `}>
        {/* Status icon */}
        <div className="flex-shrink-0">
          {config.icon}
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value.toUpperCase())}
          onKeyDown={handleKeyDown}
          disabled={disabled || state === 'searching'}
          placeholder="Type PLU code and press Enter (e.g. CB1)"
          className={`
            flex-1 bg-transparent outline-none text-lg
            font-mono tracking-widest placeholder:font-sans
            placeholder:tracking-normal placeholder:text-sm
            placeholder:text-gray-400 text-gray-900
          `}
          autoComplete="off"
          spellCheck={false}
        />

        {/* Keyboard hint */}
        <kbd className="hidden sm:flex items-center gap-1 text-xs
                        text-gray-400 border border-gray-200
                        rounded px-1.5 py-0.5">
          ↵ Enter
        </kbd>
      </div>

      {/* Feedback messages */}
      <div className="h-6 mt-1.5 px-1">
        {state === 'found' && lastFound && (
          <p className="text-sm text-green-600 font-medium">
            ✓ {lastFound.name} — ₹{lastFound.total.toFixed(2)} added
          </p>
        )}
        {(state === 'not_found' || state === 'error') && (
          <p className="text-sm text-red-600">
            {errorMsg}
          </p>
        )}
        {state === 'idle' && (
          <p className="text-xs text-gray-400">
            Tab to move between fields • Enter to add item • Esc to clear
          </p>
        )}
      </div>
    </div>
  )
}