'use client';

import { useState }          from 'react';
import { useTopUp,
         useUpdateMember,
         useCreateMember }   from '@/hooks/useMembers';
import { TIER_LABELS,
         TIER_DEFAULT_LIMIT } from './utils';
import type { MemberWithBalance, MemberTier } from '@/types';

const TIERS: MemberTier[] = ['STANDARD', 'SILVER', 'GOLD', 'PLATINUM'];

const inputCls =
  'w-full h-9 px-3 text-sm rounded-lg border border-gray-200 bg-white ' +
  'text-gray-900 focus:outline-none focus:border-blue-400 transition';

// ── Shared primitives ─────────────────────────────────────────────────────────

function ModalShell({ title, onClose, children }: {
  title: string; onClose: () => void; children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-xl border border-gray-200 p-5 w-96 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      {children}
    </div>
  );
}

function ModalFooter({ onCancel, onConfirm, confirmLabel, loading }: {
  onCancel: () => void; onConfirm: () => void;
  confirmLabel: string; loading: boolean;
}) {
  return (
    <div className="flex justify-end gap-2 mt-5">
      <button onClick={onCancel}
        className="px-4 py-2 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
        Cancel
      </button>
      <button onClick={onConfirm} disabled={loading}
        className="px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
        {loading ? 'Please wait…' : confirmLabel}
      </button>
    </div>
  );
}

// ── TopUpModal ────────────────────────────────────────────────────────────────

export function TopUpModal({ member, onClose }: { member: MemberWithBalance; onClose: () => void }) {
  const [amount, setAmount]    = useState('');
  const [desc,   setDesc]      = useState('');
  const [error,  setError]     = useState('');
  const topUp = useTopUp(member.id);

  async function handleSubmit() {
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) { setError('Enter a valid positive amount.'); return; }
    setError('');
    try {
      await topUp.mutateAsync({ amount: parsed.toFixed(2), description: desc.trim() || 'Top-up' });
      onClose();
    } catch { setError('Top-up failed. Please try again.'); }
  }

  return (
    <ModalShell title={`Top up — ${member.full_name}`} onClose={onClose}>
      <div className="space-y-3">
        <FormField label="Amount (₹)">
          <input type="number" min="1" placeholder="e.g. 500"
            value={amount} onChange={(e) => setAmount(e.target.value)}
            className={inputCls} autoFocus />
        </FormField>
        <FormField label="Note (optional)">
          <input type="text" placeholder="e.g. Monthly top-up"
            value={desc} onChange={(e) => setDesc(e.target.value)}
            className={inputCls} />
        </FormField>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
      <ModalFooter onCancel={onClose} onConfirm={handleSubmit}
        confirmLabel="Confirm top-up" loading={topUp.isPending} />
    </ModalShell>
  );
}

// ── EditMemberModal ───────────────────────────────────────────────────────────

export function EditMemberModal({ member, onClose }: { member: MemberWithBalance; onClose: () => void }) {
  const [fullName,    setFullName]    = useState(member.full_name);
  const [phone,       setPhone]       = useState(member.phone);
  const [email,       setEmail]       = useState(member.email ?? '');
  const [tier,        setTier]        = useState<MemberTier>(member.tier);
  const [creditLimit, setCreditLimit] = useState(member.credit_limit);
  const [error,       setError]       = useState('');
  const update = useUpdateMember(member.id);

  async function handleSave() {
    if (!fullName.trim() || !phone.trim()) { setError('Name and phone are required.'); return; }
    setError('');
    try {
      await update.mutateAsync({
        full_name: fullName.trim(), phone: phone.trim(),
        email: email.trim() || undefined, tier,
        credit_limit: parseFloat(creditLimit).toFixed(2),
      });
      onClose();
    } catch { setError('Update failed. Please try again.'); }
  }

  return (
    <ModalShell title="Edit member" onClose={onClose}>
      <div className="space-y-3">
        <FormField label="Full name">
          <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputCls} />
        </FormField>
        <FormField label="Phone">
          <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} />
        </FormField>
        <FormField label="Email">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
        </FormField>
        <FormField label="Tier">
          <select value={tier} onChange={(e) => setTier(e.target.value as MemberTier)} className={inputCls}>
            {TIERS.map((t) => <option key={t} value={t}>{TIER_LABELS[t]}</option>)}
          </select>
        </FormField>
        <FormField label="Credit limit (₹)">
          <input type="number" min="0" value={creditLimit}
            onChange={(e) => setCreditLimit(e.target.value)} className={inputCls} />
        </FormField>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
      <ModalFooter onCancel={onClose} onConfirm={handleSave}
        confirmLabel="Save changes" loading={update.isPending} />
    </ModalShell>
  );
}

// ── NewMemberModal ────────────────────────────────────────────────────────────

export function NewMemberModal({ onClose, onCreated }: {
  onClose: () => void; onCreated: (id: number) => void;
}) {
  const [fullName, setFullName] = useState('');
  const [phone,    setPhone]    = useState('');
  const [email,    setEmail]    = useState('');
  const [tier,     setTier]     = useState<MemberTier>('STANDARD');
  const [error,    setError]    = useState('');
  const create = useCreateMember();

  async function handleCreate() {
    if (!fullName.trim() || !phone.trim()) { setError('Name and phone are required.'); return; }
    setError('');
    try {
      const member = await create.mutateAsync({
        full_name: fullName.trim(), phone: phone.trim(),
        email: email.trim() || undefined, tier,
        credit_limit: TIER_DEFAULT_LIMIT[tier].toFixed(2),
      });
      onCreated(member.id);
    } catch (err: any) {
      const detail = err?.response?.data?.phone?.[0]
        ?? err?.response?.data?.detail
        ?? 'Creation failed. Please try again.';
      setError(detail);
    }
  }

  return (
    <ModalShell title="New member" onClose={onClose}>
      <div className="space-y-3">
        <FormField label="Full name">
          <input type="text" placeholder="e.g. Priya Menon"
            value={fullName} onChange={(e) => setFullName(e.target.value)}
            className={inputCls} autoFocus />
        </FormField>
        <FormField label="Phone (must be unique)">
          <input type="tel" placeholder="10-digit mobile"
            value={phone} onChange={(e) => setPhone(e.target.value)}
            className={inputCls} />
        </FormField>
        <FormField label="Email (optional)">
          <input type="email" placeholder="member@example.com"
            value={email} onChange={(e) => setEmail(e.target.value)}
            className={inputCls} />
        </FormField>
        <FormField label="Tier">
          <select value={tier} onChange={(e) => setTier(e.target.value as MemberTier)} className={inputCls}>
            {TIERS.map((t) => <option key={t} value={t}>{TIER_LABELS[t]}</option>)}
          </select>
        </FormField>
        <FormField label="Credit limit (auto)">
          <input type="text" readOnly
            value={`₹${TIER_DEFAULT_LIMIT[tier].toLocaleString('en-IN')}`}
            className={`${inputCls} bg-gray-50 text-gray-500 cursor-not-allowed`} />
        </FormField>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
      <ModalFooter onCancel={onClose} onConfirm={handleCreate}
        confirmLabel="Create member" loading={create.isPending} />
    </ModalShell>
  );
}