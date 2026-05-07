'use client';

import { useMemberStatement }              from '@/hooks/useMembers';
import { ENTRY_TYPE_LABELS, ENTRY_ICON_STYLES,
         formatCurrency, formatDate }      from './utils';
import type { CreditLedgerEntry, LedgerEntryType } from '@/types';

export function StatementTab({ memberId }: { memberId: number }) {
  const { data, isLoading, isError } = useMemberStatement(memberId);

  if (isLoading) {
    return (
      <div className="px-5 py-2 animate-pulse space-y-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-3 border-b border-gray-100">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 bg-gray-100 rounded w-48" />
              <div className="h-2 bg-gray-100 rounded w-32" />
            </div>
            <div className="h-3 bg-gray-100 rounded w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return <p className="text-xs text-red-500 text-center py-8">Failed to load statement.</p>;
  }

  const entries = data?.entries ?? [];

  if (entries.length === 0) {
    return <p className="text-xs text-gray-400 text-center py-8">No transactions yet.</p>;
  }

  return (
    <div className="px-5 py-2">
      {entries.map((entry) => <LedgerRow key={entry.id} entry={entry} />)}
    </div>
  );
}

function LedgerRow({ entry }: { entry: CreditLedgerEntry }) {
  const type     = entry.entry_type as LedgerEntryType;
  const styles   = ENTRY_ICON_STYLES[type];
  const amount   = parseFloat(entry.amount);
  const isCredit = amount > 0;

  const iconPaths: Record<string, string> = {
    'arrow-down':       'M12 4v16m0 0l-4-4m4 4l4-4',
    'arrow-up':         'M12 20V4m0 0l-4 4m4-4l4 4',
    'refresh':          'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
    'corner-left-down': 'M9 14l-4 4-4-4m4 4V6a2 2 0 012-2h14',
  };

  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${styles.wrapper}`}>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}
             viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round"
            d={iconPaths[styles.icon] ?? iconPaths['arrow-down']} />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {entry.description || ENTRY_TYPE_LABELS[type]}
        </p>
        <p className="text-xs text-gray-400">
          {formatDate(entry.created_at)} · {ENTRY_TYPE_LABELS[type]}
          {entry.created_by_name && ` · ${entry.created_by_name}`}
        </p>
      </div>
      <span className={`text-sm font-medium ${isCredit ? 'text-emerald-700' : 'text-red-600'}`}>
        {isCredit ? '+' : ''}{formatCurrency(entry.amount)}
      </span>
    </div>
  );
}