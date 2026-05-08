// ── Money formatting ──────────────────────────────────────────
export function toMoney(value: any): string {
  const num = parseFloat(String(value ?? 0))
  return isNaN(num) ? '0.00' : num.toFixed(2)
}

// ── Date formatting ───────────────────────────────────────────
export function formatDate(value: any, fallback = '—'): string {
  if (!value) return fallback
  const d = new Date(value)
  return isNaN(d.getTime())
    ? fallback
    : d.toLocaleDateString('en-IN', {
        day: 'numeric', month: 'long', year: 'numeric'
      })
}

export function formatDateTime(value: any, fallback = '—'): string {
  if (!value) return fallback
  const d = new Date(value)
  return isNaN(d.getTime())
    ? fallback
    : d.toLocaleString('en-IN', {
        day: 'numeric', month: 'short',
        year: 'numeric', hour: '2-digit',
        minute: '2-digit'
      })
}

// ── Safe branch ID ────────────────────────────────────────────
export function safeBranchId(user: any): number {
  return user?.branch_id ?? 1
}

// ── Class name joiner ─────────────────────────────────────────
export function cn(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(' ')
}
