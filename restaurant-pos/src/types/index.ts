// ── Auth Types ────────────────────────────────────────────────
export type Role = 'OWNER' | 'MANAGER' | 'BILLING' | 'INVENTORY'

export interface User {
  id: number
  email: string
  full_name: string
  role: Role
  branch_id: number | null
  branch_name: string
}

export interface AuthTokens {
  access: string
  refresh: string
  user: User
}

// ── Inventory Types ───────────────────────────────────────────
export interface Category {
  id: number
  name: string
  icon: string
  sort_order: number
  is_active: boolean
  item_count: number
}

export interface MenuItem {
  id: number
  category: number
  category_name: string
  name: string
  short_code: string
  base_price: string
  tax_percent: string
  is_available: boolean
  tags: string[]
}

export interface PLUResult {
  id: number
  short_code: string
  name: string
  category: string
  price: number
  tax_percent: number
  tax_amount: number
  total: number
  tags: string[]
  prep_time: number
}

// ── Billing Types ─────────────────────────────────────────────
export interface CartItem {
  menu_item_id: number
  short_code: string
  name: string
  quantity: number
  unit_price: number
  tax_percent: number
  tax_amount: number
  line_total: number
}

export interface SaleItem {
  id: number
  short_code: string
  item_name: string
  quantity: number
  unit_price: string
  tax_amount: string
  line_total: string
}

export interface Payment {
  id: number
  method: string
  amount: string
  transaction_ref: string
  created_at: string
}

export type SaleStatus = 'PENDING' | 'PAID' | 'VOID'
export type PaymentMethod = 'CASH' | 'CARD' | 'UPI' | 'CREDIT' | 'SPLIT'

export interface Sale {
  id: number
  bill_number: string
  branch: number
  branch_name: string
  billed_by: number
  billed_by_name: string
  customer_name: string
  table_number: string
  subtotal: string
  tax_total: string
  discount_amount: string
  total: string
  status: SaleStatus
  payment_method: PaymentMethod | ''
  notes: string
  created_at: string
  paid_at: string | null
  items: SaleItem[]
  payments: Payment[]
}

// ── Member Types ──────────────────────────────────────────────
export interface Member {
  id: number
  card_number: string
  full_name: string
  phone: string
  tier: 'STANDARD' | 'SILVER' | 'GOLD' | 'PLATINUM'
  credit_limit: string
  current_balance: number
  available_credit: number
}

// ── Analytics Types ───────────────────────────────────────────
export interface DashboardSummary {
  date: string
  total_revenue: number
  total_bills: number
  avg_bill_value: number
  total_items_sold: number
  revenue_vs_yesterday: {
    yesterday_revenue: number
    change_percent: number
    trend: 'up' | 'down'
  }
}

export interface TrendPoint {
  date: string
  revenue: number
  bill_count: number
}

export interface TopItem {
  item_id: number
  name: string
  short_code: string
  category: string
  total_qty: number
  total_revenue: number
}
export type MemberTier = 'STANDARD' | 'SILVER' | 'GOLD' | 'PLATINUM';

export type LedgerEntryType = 'CREDIT' | 'DEBIT' | 'REVERSAL' | 'REFUND';

export interface Member {
  id: number;
  card_number: string;
  full_name: string;
  phone: string;
  email: string;
  tier: MemberTier;
  credit_limit: string;
  is_active: boolean;
  date_joined: string;
  branch_name?: string;
}

export interface MemberWithBalance extends Member {
  balance: string;
}

export interface CreditLedgerEntry {
  id: number;
  member: number;
  sale: string | null;
  amount: string;
  entry_type: LedgerEntryType;
  description: string;
  created_by_name: string;
  created_at: string;
}

export interface MemberStatement {
  member: MemberWithBalance;
  entries: CreditLedgerEntry[];
}

export interface CreateMemberPayload {
  full_name: string;
  phone: string;
  email?: string;
  tier?: MemberTier;
  credit_limit?: string;
}

export interface UpdateMemberPayload {
  full_name?: string;
  phone?: string;
  email?: string;
  tier?: MemberTier;
  credit_limit?: string;
}

export interface TopUpPayload {
  amount: string;
  description?: string;
}

export interface CardLookupResponse {
  member: MemberWithBalance;
}