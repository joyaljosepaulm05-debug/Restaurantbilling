'use client'

import { useState }          from 'react';
import { useMember }         from '@/hooks/useMembers';
import { useAuthStore }      from '@/store/authStore';
import { DetailsTab }        from './DetailsTab';
import { StatementTab }      from './StatementTab';
import { TopUpModal,
         EditMemberModal }   from './Modals';
import { TIER_STYLES, TIER_LABELS,
         getInitials, formatBalance,
         formatCurrency }    from './utils';

type Tab = 'details' | 'statement';

interface Props {
  memberId:   number;
  onDeselect: () => void;
}

export function MemberDetail({ memberId, onDeselect }: Props) {
  const [activeTab,  setActiveTab]  = useState<Tab>('details');
  const [showTopUp,  setShowTopUp]  = useState(false);
  const [showEdit,   setShowEdit]   = useState(false);

  const { isManager } = useAuthStore();
  const { data: member, isLoading, isError } = useMember(memberId);

  if (isLoading) {
    return (
      <div className="flex flex-col h-full animate-pulse">
        <div className="bg-white border-b border-gray-200 px-5 py-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-gray-100" />
          <div className="space-y-2">
            <div className="h-4 bg-gray-100 rounded w-36" />
            <div className="h-3 bg-gray-100 rounded w-24" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !member) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-red-500">
        Failed to load member.
      </div>
    );
  }

  const styles  = TIER_STYLES[member.tier];
  const balance = parseFloat(member.balance);

  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-5 py-4 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 ${styles.avatar}`}>
            {getInitials(member.full_name)}
          </div>
          <div>
            <h1 className="text-base font-medium text-gray-900">{member.full_name}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles.badge}`}>
                {TIER_LABELS[member.tier]}
              </span>
              <span className="text-xs text-gray-400 font-mono">{member.card_number}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isManager() && (
            <button
              onClick={() => setShowTopUp(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
            >
              + Top up
            </button>
          )}
          <button
            onClick={() => setShowEdit(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 transition-colors"
          >
            Edit
          </button>
          <button onClick={onDeselect} className="text-gray-400 hover:text-gray-600 p-1">✕</button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3 px-5 py-3 bg-gray-50 border-b border-gray-200">
        <div className="bg-white rounded-lg border border-gray-200 px-3 py-2.5">
          <p className="text-xs text-gray-500 mb-0.5">Balance</p>
          <p className={`text-lg font-medium ${balance >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
            {formatBalance(member.balance)}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 px-3 py-2.5">
          <p className="text-xs text-gray-500 mb-0.5">Credit limit</p>
          <p className="text-lg font-medium text-gray-900">{formatCurrency(member.credit_limit)}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 px-3 py-2.5">
          <p className="text-xs text-gray-500 mb-0.5">Available</p>
          <p className="text-lg font-medium text-gray-900">
            {formatCurrency(Math.max(0, parseFloat(member.credit_limit) + balance).toString())}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white px-5">
        {(['details', 'statement'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`text-sm font-medium py-2.5 px-4 border-b-2 capitalize transition-colors ${
              activeTab === tab
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'details'   && <DetailsTab   member={member} />}
        {activeTab === 'statement' && <StatementTab memberId={memberId} />}
      </div>

      {showTopUp && <TopUpModal    member={member} onClose={() => setShowTopUp(false)} />}
      {showEdit  && <EditMemberModal member={member} onClose={() => setShowEdit(false)} />}
    </div>
  );
}