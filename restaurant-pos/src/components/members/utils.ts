import type { MemberTier, LedgerEntryType } from '@/types';

export const TIER_LABELS: Record<MemberTier, string> = {
  STANDARD: 'Standard',
  SILVER:   'Silver',
  GOLD:     'Gold',
  PLATINUM: 'Platinum',
};

export const TIER_STYLES: Record<MemberTier, { badge: string; avatar: string; dot: string }> = {
  STANDARD: {
    badge:  'bg-emerald-50 text-emerald-800',
    avatar: 'bg-emerald-50 text-emerald-800',
    dot:    'bg-emerald-500',
  },
  SILVER: {
    badge:  'bg-gray-100 text-gray-700',
    avatar: 'bg-gray-100 text-gray-700',
    dot:    'bg-gray-400',
  },
  GOLD: {
    badge:  'bg-amber-50 text-amber-800',
    avatar: 'bg-amber-50 text-amber-800',
    dot:    'bg-amber-400',
  },
  PLATINUM: {
    badge:  'bg-violet-50 text-violet-800',
    avatar: 'bg-violet-50 text-violet-800',
    dot:    'bg-violet-500',
  },
};

export const TIER_DEFAULT_LIMIT: Record<MemberTier, number> = {
  STANDARD: 500,
  SILVER:   1500,
  GOLD:     3000,
  PLATINUM: 5000,
};

export const ENTRY_TYPE_LABELS: Record<LedgerEntryType, string> = {
  CREDIT:   'Top-up',
  DEBIT:    'Purchase',
  REVERSAL: 'Reversal',
  REFUND:   'Refund',
};

export const ENTRY_ICON_STYLES: Record<LedgerEntryType, { wrapper: string; icon: string }> = {
  CREDIT:   { wrapper: 'bg-emerald-50 text-emerald-700', icon: 'arrow-down' },
  DEBIT:    { wrapper: 'bg-red-50 text-red-700',         icon: 'arrow-up' },
  REVERSAL: { wrapper: 'bg-violet-50 text-violet-700',   icon: 'refresh' },
  REFUND:   { wrapper: 'bg-blue-50 text-blue-700',       icon: 'corner-left-down' },
};

export function formatCurrency(value: string | number): string {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  const abs = Math.abs(n).toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return n < 0 ? `-₹${abs}` : `₹${abs}`;
}

export function formatBalance(value: string | number): string {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  if (n >= 0) return `+₹${n.toLocaleString('en-IN')}`;
  return `-₹${Math.abs(n).toLocaleString('en-IN')}`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day:   'numeric',
    month: 'short',
    year:  'numeric',
  });
}

export function getInitials(name: string): string {
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

export function maskCard(card: string): string {
  if (card.length <= 8) return card;
  return card.slice(0, 8) + '···';
}