import { useEffect, useState } from 'react';
import type { Account, TxType } from '../types';
import { CATEGORIES, CATEGORY_IDS } from '../lib/categories';
import { activeFilterCount, type Filters } from '../lib/filters';
import { parseAmount } from '../lib/validation';
import Field from './Field';
import Icon from './Icon';
import s from './FilterBar.module.css';

interface Props { filters: Filters; accounts: Account[]; onChange: (patch: Partial<Filters>) => void; onReset: () => void }

const PRESETS: { value: Filters['preset']; label: string }[] = [
  { value: '7d', label: '7D' }, { value: '30d', label: '30D' }, { value: '90d', label: '90D' },
  { value: 'all', label: 'All' }, { value: 'custom', label: 'Custom' },
];
const TYPES: { value: TxType; label: string }[] = [
  { value: 'income', label: '💰 Income' }, { value: 'expense', label: '💸 Expense' }, { value: 'transfer', label: '🔁 Transfer' },
];

const toggle = <T,>(list: T[], v: T): T[] => (list.includes(v) ? list.filter(x => x !== v) : [...list, v]);

/** Keeps a free-typed draft and commits a parsed number on blur/Enter, so "12." isn't eaten mid-typing. */
function AmountInput({ label, value, onCommit }: { label: string; value?: number; onCommit: (v: number | undefined) => void }) {
  const [draft, setDraft] = useState(value?.toString() ?? '');
  useEffect(() => setDraft(value?.toString() ?? ''), [value]);
  const commit = () => {
    const next = draft.trim() === '' ? undefined : parseAmount(draft) ?? undefined;
    if (next === undefined) setDraft('');
    if (next !== value) onCommit(next);
  };
  return (
    <div className={s.small}>
      <Field label={label}>
        <input inputMode="decimal" placeholder="0" value={draft} onChange={e => setDraft(e.target.value)}
          onBlur={commit} onKeyDown={e => { if (e.key === 'Enter') commit(); }} />
      </Field>
    </div>
  );
}

export default function FilterBar({ filters, accounts, onChange, onReset }: Props) {
  const [q, setQ] = useState(filters.q);
  useEffect(() => setQ(filters.q), [filters.q]);
  return (
    <div className={s.bar}>
      <div className={s.row}>
        <label className={s.search}>
          <Icon name="search" size={18} />
          <input type="search" placeholder="Search description or category" aria-label="Search"
            value={q} onChange={e => { setQ(e.target.value); onChange({ q: e.target.value }); }} />
        </label>
        <div className="segmented" role="group" aria-label="Date range">
          {PRESETS.map(p => (
            <button key={p.value} type="button" aria-pressed={filters.preset === p.value} onClick={() => onChange({ preset: p.value })}>{p.label}</button>
          ))}
        </div>
      </div>

      {filters.preset === 'custom' && (
        <div className={s.row}>
          <Field label="From"><input type="date" value={filters.from ?? ''} onChange={e => onChange({ from: e.target.value || undefined })} /></Field>
          <Field label="To"><input type="date" value={filters.to ?? ''} onChange={e => onChange({ to: e.target.value || undefined })} /></Field>
        </div>
      )}

      <div className={s.chips} role="group" aria-label="Type">
        {TYPES.map(t => (
          <button key={t.value} type="button" className="chip" aria-pressed={filters.types.includes(t.value)}
            onClick={() => onChange({ types: toggle(filters.types, t.value) })}>{t.label}</button>
        ))}
      </div>

      <div className={s.chips} role="group" aria-label="Categories">
        {CATEGORY_IDS.map(c => (
          <button key={c} type="button" className="chip" aria-pressed={filters.categories.includes(c)}
            onClick={() => onChange({ categories: toggle(filters.categories, c) })}>{CATEGORIES[c].emoji} {CATEGORIES[c].label}</button>
        ))}
      </div>

      <div className={s.row}>
        <Field label="Account">
          <select value={filters.accountId ?? ''} onChange={e => onChange({ accountId: e.target.value || undefined })}>
            <option value="">All accounts</option>
            {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </Field>
        <AmountInput label="Min amount" value={filters.min} onCommit={min => onChange({ min })} />
        <AmountInput label="Max amount" value={filters.max} onCommit={max => onChange({ max })} />
        {activeFilterCount(filters) > 0 && <button type="button" className="btn btn-ghost" onClick={onReset}>Reset filters</button>}
      </div>
    </div>
  );
}
