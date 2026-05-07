import { create } from 'zustand'
import { CartItem } from '@/types'

interface CartState {
  items: CartItem[]
  customerName: string
  tableNumber: string
  branchId: number | null

  // Actions
  addItem: (item: CartItem) => void
  removeItem: (shortCode: string) => void
  updateQuantity: (shortCode: string, quantity: number) => void
  clearCart: () => void
  setCustomerName: (name: string) => void
  setTableNumber: (table: string) => void
  setBranchId: (id: number) => void

  // Computed
  subtotal: () => number
  taxTotal: () => number
  grandTotal: () => number
  itemCount: () => number
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  customerName: '',
  tableNumber: '',
  branchId: null,

  addItem: (newItem) => {
    const items = get().items
    const existing = items.find(i => i.short_code === newItem.short_code)

    if (existing) {
      // Item already in cart — increment quantity
      set({
        items: items.map(i =>
          i.short_code === newItem.short_code
            ? {
                ...i,
                quantity: i.quantity + newItem.quantity,
                tax_amount: parseFloat(
                  ((i.unit_price * (i.quantity + newItem.quantity))
                  * i.tax_percent / 100).toFixed(2)
                ),
                line_total: parseFloat(
                  (i.unit_price * (i.quantity + newItem.quantity)
                  * (1 + i.tax_percent / 100)).toFixed(2)
                ),
              }
            : i
        ),
      })
    } else {
      // New item — add to cart
      set({ items: [...items, newItem] })
    }
  },

  removeItem: (shortCode) => {
    set({ items: get().items.filter(i => i.short_code !== shortCode) })
  },

  updateQuantity: (shortCode, quantity) => {
    if (quantity <= 0) {
      get().removeItem(shortCode)
      return
    }
    set({
      items: get().items.map(i =>
        i.short_code === shortCode
          ? {
              ...i,
              quantity,
              tax_amount: parseFloat(
                (i.unit_price * quantity * i.tax_percent / 100).toFixed(2)
              ),
              line_total: parseFloat(
                (i.unit_price * quantity * (1 + i.tax_percent / 100)).toFixed(2)
              ),
            }
          : i
      ),
    })
  },

  clearCart: () => set({
    items: [],
    customerName: '',
    tableNumber: '',
  }),

  setCustomerName: (name) => set({ customerName: name }),
  setTableNumber: (table) => set({ tableNumber: table }),
  setBranchId: (id) => set({ branchId: id }),

  // Computed values
  subtotal: () => {
    return parseFloat(
      get().items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0)
      .toFixed(2)
    )
  },

  taxTotal: () => {
    return parseFloat(
      get().items.reduce((sum, i) => sum + i.tax_amount, 0)
      .toFixed(2)
    )
  },

  grandTotal: () => {
    return parseFloat(
      (get().subtotal() + get().taxTotal()).toFixed(2)
    )
  },

  itemCount: () => {
    return get().items.reduce((sum, i) => sum + i.quantity, 0)
  },
}))