'use client';

import { formatDate, TIER_LABELS, TIER_STYLES, formatCurrency } from './utils';
import type { MemberWithBalance } from '@/types';

export function DetailsTab({ member }: { member: MemberWithBalance }) {
  const styles = TIER_STYLES[member.tier];

  return (
    <div className="px-5 py-4 space-y-6">
      <section>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Contact</p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          <Field label="Phone"        value={member.phone} />
          <Field label="Email"        value={member.email || '—'} />
          <Field label="Member since" value={formatDate(member.date_joined)} />
          <Field label="Status"
            value={
              <span className={`inline-flex text-xs font-medium px-2 py-0.5 rounded-full ${
                member.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
              }`}>
                {member.is_active ? 'Active' : 'Inactive'}
              </span>
            }
          />
        </div>
      </section>

      <section>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Membership</p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          <Field label="Card number"
            value={<span className="font-mono text-xs">{member.card_number}</span>}
          />
          <Field label="Tier"
            value={
              <span className={`inline-flex text-xs font-medium px-2 py-0.5 rounded-full ${styles.badge}`}>
                {TIER_LABELS[member.tier]}
              </span>
            }
          />
          <Field label="Credit limit" value={formatCurrency(member.credit_limit)} />
          <Field label="Home branch"  value={member.branch_name ?? '—'} />
        </div>
      </section>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-gray-900">{value}</p>
    </div>
  );
}