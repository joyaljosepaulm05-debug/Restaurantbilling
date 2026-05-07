'use client'

import { useState } from 'react';
import { useMembersList }         from '@/hooks/useMembers';
import { TIER_STYLES, TIER_LABELS,
         getInitials, maskCard,
         formatCurrency }         from './utils';
import type { MemberTier, MemberWithBalance } from '@/types';

const TIERS: Array<MemberTier | 'ALL'> = ['ALL', 'PLATINUM', 'GOLD', 'SILVER', 'STANDARD'];

interface Props {
  selectedId: number | null;
  onSelect:   (id: number) => void;
}

export function MemberList({ selectedId, onSelect }: Props) {
  const [search, setSearch]           = useState('');
  const [activeTier, setActiveTier]   = useState<MemberTier | 'ALL'>('ALL');

  const { data: members = [], isLoading, isError } = useMembersList(search || undefined);

  const filtered = activeTier === 'ALL'
    ? members
    : members.filter((m) => m.tier === activeTier);

  return (
    <>
      <div className="px-3 py-2 border-b border-gray-100">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, phone, card…"
          className="w-full px-3 py-1.5 text-sm rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:border-blue-400 focus:bg-white transition"
        />
      </div>

      <div className="flex gap-1.5 px-3 py-2 border-b border-gray-100 flex-wrap">
        {TIERS.map((tier) => (
          <button
            key={tier}
            onClick={() => setActiveTier(tier)}
            className={`text-xs font-medium px-2.5 py-1 rounded-full border transition-colors ${
              activeTier === tier
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
            }`}
          >
            {tier === 'ALL' ? 'All' : TIER_LABELS[tier]}
          </button>
        ))}
      </div>

      <div className="px-3 py-1.5 border-b border-gray-100">
        <span className="text-xs text-gray-400">
          {filtered.length} member{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2.5 border-b border-gray-100 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-gray-100" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-gray-100 rounded w-32" />
                  <div className="h-2 bg-gray-100 rounded w-24" />
                </div>
              </div>
            ))}
          </>
        )}
        {isError && (
          <p className="text-xs text-red-500 text-center py-6">Failed to load members.</p>
        )}
        {!isLoading && !isError && filtered.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-6">No members found.</p>
        )}
        {!isLoading && !isError && filtered.map((m) => {
          const styles  = TIER_STYLES[m.tier];

          const balance = parseFloat(m.balance);
          return (
            <button
              key={m.id}
              onClick={() => onSelect(m.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 border-b border-gray-100 text-left hover:bg-gray-50 transition-colors ${
                m.id === selectedId ? 'bg-blue-50' : ''
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${styles.avatar}`}>
                {getInitials(m.full_name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{m.full_name}</p>
                <p className="text-xs text-gray-400 truncate">{maskCard(m.card_number)} · {m.phone}</p>
              </div>
              <div className="flex flex-col items-end gap-0.5">
                <span className={`text-xs font-medium ${balance >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                  {formatCurrency(m.balance)}
                </span>
                <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`} />
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}