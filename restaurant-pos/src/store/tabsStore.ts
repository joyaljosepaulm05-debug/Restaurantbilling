import { create } from 'zustand'
import { CartItem } from '@/types'

export interface BillingTab {
  id:           string
  label:        string       // "Tab 1", "Table 4", etc.
  customerName: string
  tableNumber:  string
  items:        CartItem[]
  createdAt:    number
}

function makeTab(index: number): BillingTab {
  return {
    id:           crypto.randomUUID(),
    label:        `Tab ${index}`,
    customerName: '',
    tableNumber:  '',
    items:        [],
    createdAt:    Date.now(),
  }
}

function computeItem(
  existing: CartItem,
  newQty: number
): CartItem {
  const qty        = newQty
  const tax_amount = parseFloat(
    (existing.unit_price * qty * existing.tax_percent / 100).toFixed(2)
  )
  const line_total = parseFloat(
    (existing.unit_price * qty * (1 + existing.tax_percent / 100)).toFixed(2)
  )
  return { ...existing, quantity: qty, tax_amount, line_total }
}

interface TabsState {
  tabs:          BillingTab[]
  activeTabId:   string

  // Tab actions
  addTab:        () => void
  closeTab:      (id: string) => void
  setActiveTab:  (id: string) => void
  setTabLabel:   (id: string, label: string) => void
  nextTab:       () => void
  prevTab:       () => void
  goToTabIndex:  (index: number) => void

  // Cart actions (operate on active tab)
  addItem:         (item: CartItem) => void
  removeItem:      (shortCode: string) => void
  updateQuantity:  (shortCode: string, qty: number) => void
  clearCart:       () => void
  setCustomerName: (name: string) => void
  setTableNumber:  (table: string) => void

  // Computed (active tab)
  activeTab:     () => BillingTab
  subtotal:      () => number
  taxTotal:      () => number
  grandTotal:    () => number
  itemCount:     () => number
}

const firstTab = makeTab(1)

export const useTabsStore = create<TabsState>((set, get) => ({
  tabs:        [firstTab],
  activeTabId: firstTab.id,

  // ── Tab management ────────────────────────────────────────────
  addTab: () => {
    const tabs     = get().tabs
    const newTab   = makeTab(tabs.length + 1)
    set({ tabs: [...tabs, newTab], activeTabId: newTab.id })
  },

  closeTab: (id) => {
    const tabs = get().tabs
    if (tabs.length === 1) return    // always keep at least one tab
    const idx    = tabs.findIndex(t => t.id === id)
    const next   = tabs[idx === 0 ? 1 : idx - 1]
    set({
      tabs:        tabs.filter(t => t.id !== id),
      activeTabId: get().activeTabId === id ? next.id : get().activeTabId,
    })
  },

  setActiveTab: (id) => set({ activeTabId: id }),

  setTabLabel: (id, label) => set(s => ({
    tabs: s.tabs.map(t => t.id === id ? { ...t, label } : t)
  })),

  nextTab: () => {
    const { tabs, activeTabId } = get()
    const idx  = tabs.findIndex(t => t.id === activeTabId)
    const next = tabs[(idx + 1) % tabs.length]
    set({ activeTabId: next.id })
  },

  prevTab: () => {
    const { tabs, activeTabId } = get()
    const idx  = tabs.findIndex(t => t.id === activeTabId)
    const prev = tabs[(idx - 1 + tabs.length) % tabs.length]
    set({ activeTabId: prev.id })
  },

  goToTabIndex: (index) => {
    const tab = get().tabs[index]
    if (tab) set({ activeTabId: tab.id })
  },

  // ── Cart actions (active tab) ─────────────────────────────────
  addItem: (newItem) => {
    const { tabs, activeTabId } = get()
    set({
      tabs: tabs.map(t => {
        if (t.id !== activeTabId) return t
        const existing = t.items.find(
          i => i.short_code === newItem.short_code
        )
        if (existing) {
          return {
            ...t,
            items: t.items.map(i =>
              i.short_code === newItem.short_code
                ? computeItem(i, i.quantity + newItem.quantity)
                : i
            ),
          }
        }
        return { ...t, items: [...t.items, newItem] }
      }),
    })
  },

  removeItem: (shortCode) => {
    const { tabs, activeTabId } = get()
    set({
      tabs: tabs.map(t =>
        t.id === activeTabId
          ? { ...t, items: t.items.filter(i => i.short_code !== shortCode) }
          : t
      ),
    })
  },

  updateQuantity: (shortCode, qty) => {
    const { tabs, activeTabId } = get()
    if (qty <= 0) { get().removeItem(shortCode); return }
    set({
      tabs: tabs.map(t =>
        t.id === activeTabId
          ? {
              ...t,
              items: t.items.map(i =>
                i.short_code === shortCode
                  ? computeItem(i, qty)
                  : i
              ),
            }
          : t
      ),
    })
  },

  clearCart: () => {
    const { tabs, activeTabId } = get()
    set({
      tabs: tabs.map(t =>
        t.id === activeTabId
          ? { ...t, items: [], customerName: '', tableNumber: '' }
          : t
      ),
    })
  },

  setCustomerName: (name) => {
    const { tabs, activeTabId } = get()
    set({
      tabs: tabs.map(t =>
        t.id === activeTabId ? { ...t, customerName: name } : t
      ),
    })
  },

  setTableNumber: (table) => {
    const { tabs, activeTabId } = get()
    set({
      tabs: tabs.map(t =>
        t.id === activeTabId ? { ...t, tableNumber: table } : t
      ),
    })
  },

  // ── Computed ──────────────────────────────────────────────────
  activeTab: () => {
    const { tabs, activeTabId } = get()
    return tabs.find(t => t.id === activeTabId) || tabs[0]
  },

  subtotal: () => {
    const tab = get().activeTab()
    return parseFloat(
      tab.items.reduce((s, i) => s + i.unit_price * i.quantity, 0)
        .toFixed(2)
    )
  },

  taxTotal: () => {
    const tab = get().activeTab()
    return parseFloat(
      tab.items.reduce((s, i) => s + i.tax_amount, 0).toFixed(2)
    )
  },

  grandTotal: () => {
    const s = get()
    return parseFloat((s.subtotal() + s.taxTotal()).toFixed(2))
  },

  itemCount: () => {
    const tab = get().activeTab()
    return tab.items.reduce((s, i) => s + i.quantity, 0)
  },
}))