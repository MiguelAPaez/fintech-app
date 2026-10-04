import { useMemo, useState } from 'react';
import type { Payment, PaymentStatus } from '../types';
import EmptyState from '../components/EmptyState';
import Icon from '../components/Icon';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import { CATEGORIES, RECURRENCE_LABEL } from '../lib/categories';
import { monthKey } from '../lib/dates';
import { dueLabel, paidThisMonth, paymentStatus } from '../lib/finance';
import { formatMoney } from '../lib/format';
import { newId } from '../state/financeReducer';
import { useFinance } from '../state/FinanceContext';
import PaymentModal from './PaymentModal';
import s from './PaymentsPage.module.css';

const ORDER: Record<PaymentStatus, number> = { overdue: 0, upcoming: 1, paid: 2 };

export default function PaymentsPage() {
  const { data, dispatch, today } = useFinance();
  const [editing, setEditing] = useState<Payment | 'new' | null>(null);
  const cur = data.profile.currency;
  const accountNames = useMemo(() => Object.fromEntries(data.accounts.map(a => [a.id, a.name])), [data.accounts]);
  const rows = useMemo(
    () => data.payments
      .map(p => ({ p, status: paymentStatus(p, today) }))
      .sort((a, b) => ORDER[a.status] - ORDER[b.status] || a.p.dueDate.localeCompare(b.p.dueDate)),
    [data.payments, today],
  );
  const overdue = rows.filter(r => r.status === 'overdue').length;
  const paid = paidThisMonth(data.payments, today);
  const stillToPay = rows
    .filter(r => r.status === 'overdue' || (r.status === 'upcoming' && monthKey(r.p.dueDate) === monthKey(today)))
    .reduce((sum, r) => sum + r.p.amount, 0);

  return (
    <div className="page">
      <PageHeader title="Payments ⏰" subtitle="Bills and subscriptions, sorted by what needs you first">
        <button className="btn btn-primary" disabled={!data.accounts.length} onClick={() => setEditing('new')}><Icon name="plus" /> Add bill</button>
      </PageHeader>

      <div className={s.summary}>
        <div className="card"><p className="label">Still to pay this month</p><p className={`${s.big} tabular`}>{formatMoney(stillToPay, cur)}</p></div>
        <div className="card"><p className="label">Overdue</p><p className={`${s.big} ${overdue ? s.bad : ''}`}>{overdue}</p></div>
        <div className="card"><p className="label">Paid this month</p><p className={`${s.big} ${s.good}`}>{paid}</p></div>
      </div>

      {rows.length === 0 ? (
        <div className="card"><EmptyState emoji="🧘" title="No bills yet" text="Add rent, subscriptions and anything that repeats." /></div>
      ) : (
        <ul className={s.list}>
          {rows.map(({ p, status }) => (
            <li key={p.id} className={`card ${s.item}`}>
              <span className="emoji-circle">{CATEGORIES[p.category].emoji}</span>
              <div className={s.info}>
                <p className={s.name}>{p.name}</p>
                <p className="muted small">{dueLabel(p, today)} · {RECURRENCE_LABEL[p.recurrence]} · {accountNames[p.accountId] ?? '—'}</p>
              </div>
              <span className={s.badgeCell}><StatusBadge status={status} /></span>
              <p className={`${s.amount} tabular`}>{formatMoney(p.amount, cur)}</p>
              <div className={s.actions}>
                {status !== 'paid' && (
                  <button className="btn btn-primary btn-sm" onClick={() => dispatch({ type: 'payBill', paymentId: p.id, txId: newId(), today })}>Mark as paid</button>
                )}
                <button className="icon-btn" aria-label={`Edit ${p.name}`} onClick={() => setEditing(p)}><Icon name="edit" size={18} /></button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {editing && <PaymentModal payment={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} />}
    </div>
  );
}
