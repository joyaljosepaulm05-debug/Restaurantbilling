import { useState, useCallback, useRef } from 'react'
import { inventoryApi } from '@/lib/api'
import { PLUResult, CartItem } from '@/types'
import { useTabsStore } from '@/store/tabsStore'

type LookupState = 'idle' | 'searching' | 'found' | 'not_found' | 'error'

export function usePLULookup() {
  const [state, setState]         = useState<LookupState>('idle')
  const [lastFound, setLastFound] = useState<PLUResult | null>(null)
  const [errorMsg, setErrorMsg]   = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { addItem } = useTabsStore()

  const lookup = useCallback(async (shortCode: string) => {
    const code = shortCode.trim().toUpperCase()
    if (!code) return

    setState('searching')
    setErrorMsg('')

    try {
      const response = await inventoryApi.pluLookup(code)
      const item: PLUResult = response.data

      setState('found')
      setLastFound(item)

      // Convert PLUResult → CartItem and add to cart
      const cartItem: CartItem = {
        menu_item_id: item.id,
        short_code:   item.short_code,
        name:         item.name,
        quantity:     1,
        unit_price:   item.price,
        tax_percent:  item.tax_percent,
        tax_amount:   item.tax_amount,
        line_total:   item.total,
      }
      addItem(cartItem)

      // Reset to idle after 1.5 seconds
      setTimeout(() => {
        setState('idle')
        setLastFound(null)
      }, 1500)

    } catch (err: any) {
      if (err.response?.status === 404) {
        setState('not_found')
        setErrorMsg(`"${code}" not found`)
      } else {
        setState('error')
        setErrorMsg('Connection error')
      }

      // Reset to idle after 2 seconds
      setTimeout(() => {
        setState('idle')
        setErrorMsg('')
      }, 2000)
    }
  }, [addItem])

  return { state, lastFound, errorMsg, lookup }
}