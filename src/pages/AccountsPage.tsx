import { useMemo, useState } from 'react';
import type { Account } from '../types';
import Sparkline from '../charts/Sparkline';
import EmptyState from '../components/EmptyState';
import Icon from '../components/Icon';
import PageHeader from '../components/PageHeader';
import { KIND_LABEL } from '../lib/categories';
import { accountBalance, balanceSeries, totalBalance } from '../lib/finance';
import { formatMoney } from '../lib/format';
import { useFinance } from '../state/FinanceContext';
import AccountModal from './AccountModal';
import TransferModal from './TransferModal';
import s from './AccountsPage.module.css';

function AccountCard({ account, onEdit }: { account: Account; onEdit: () => void }) {
  const { data, today } = useFinance();
  const balance = accountBalance(data, account.id, today);
  const trend = useMemo(() => balanceSeries(data, today, 30, account.id).map(p => p.balance), [data, today, account.id]);
  const count = data.transactions.filter(t => t.accountId === account.id).length;
  return (
    <article className={`card ${s.card}`} style={{ borderTopColor: account.color }}>
      <div className={s.top}>
        <span className="badge">{KIND_LABEL[account.kind]}</span>
        <button className="icon-btn" onClick={onEdit} aria-label={`Edit ${account.name}`}><Icon name="edit" size={18} /></button>
      </div>
      <h2 className={s.name}>{account.name}</h2>
      <p className={`${s.balance} tabular ${balance < 0 ? s.negative : ''}`}>{formatMoney(balance, data.profile.currency)}</p>
      <Sparkline data={trend} color={account.color} />
      <p className="muted small">{count} transaction{count === 1 ? '' : 's'} · last 30 days trend</p>
    </article>
  );
}

export default function AccountsPage() {
  const { data, today } = useFinance();
  const [editing, setEditing] = useState<Account | 'new' | null>(null);
  const [transfer, setTransfer] = useState(false);
  const n = data.accounts.length;

  return (
    <div className="page">
      <PageHeader title="Accounts 💳" subtitle={`${formatMoney(totalBalance(data, today), data.profile.currency)} across ${n} account${n === 1 ? '' : 's'}`}>
        <button className="btn btn-secondary" disabled={n < 2} onClick={() => setTransfer(true)}><Icon name="swap" /> Transfer</button>
        <button className="btn btn-primary" onClick={() => setEditing('new')}><Icon name="plus" /> Add account</button>
      </PageHeader>
      {n === 0
        ? <div className="card"><EmptyState emoji="💳" title="No accounts yet" text="Add your checking, savings or credit card to start tracking." /></div>
        : <div className={s.grid}>{data.accounts.map(a => <AccountCard key={a.id} account={a} onEdit={() => setEditing(a)} />)}</div>}
      {editing && <AccountModal account={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} />}
      {transfer && <TransferModal onClose={() => setTransfer(false)} />}
    </div>
  );
}
