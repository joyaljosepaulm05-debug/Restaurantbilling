import { useEffect, useCallback } from 'react'

type KeyHandler = (e: KeyboardEvent) => void

interface KeyMap {
  [key: string]: KeyHandler
}

/**
 * useKeyboard — registers global keyboard shortcuts
 * Automatically removes listeners on unmount
 *
 * Usage:
 *   useKeyboard({
 *     'F12': (e) => { e.preventDefault(); handleCheckout() },
 *     'Escape': () => clearInput(),
 *   })
 */
export function useKeyboard(keyMap: KeyMap, deps: any[] = []) {
  const handler = useCallback((e: KeyboardEvent) => {
    // Don't fire shortcuts when typing in input/textarea/select
    // EXCEPT for fields we explicitly allow (PLU input handles its own)
    const target = e.target as HTMLElement
    const isTyping = (
      target.tagName === 'INPUT'    ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT'
    )

    const key = e.key

    // These shortcuts always fire even while typing
    const ALWAYS_FIRE = ['F12', 'Escape', 'F2', 'F3']

    if (isTyping && !ALWAYS_FIRE.includes(key)) return

    if (keyMap[key]) {
      keyMap[key](e)
    }
  }, deps)

  useEffect(() => {
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handler])
}
