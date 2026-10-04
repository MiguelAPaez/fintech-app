import type { Currency, ID, Transaction } from '../types';
import type { Filters, SortKey } from '../lib/filters';
import { txVisual } from '../lib/categories';
import type { ISODate } from '../lib/dates';
import { txEffect } from '../lib/finance';
import { formatMoney, formatRelativeDay } from '../lib/format';
import s from './TransactionList.module.css';

interface Props {
  rows: Transaction[];
  currency: Currency;
  today: ISODate;
  accountNames?: Record<ID, string>;
  sort?: Filters['sort'];
  onSort?: (key: SortKey) => void;
  onSelect?: (tx: Transaction) => void;
}

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: 'description', label: 'Description' },
  { key: 'category', label: 'Category' },
  { key: 'account', label: 'Account' },
  { key: 'date', label: 'Date' },
  { key: 'amount', label: 'Amount' },
];

export default function TransactionList({ rows, currency, today, accountNames, sort, onSort, onSelect }: Props) {
  const columns = COLUMNS.filter(c => c.key !== 'account' || accountNames);
  return (
    <div className={`${s.list} ${accountNames ? s.withAccount : s.noAccount}`}>
      <div className={s.header}>
        {columns.map(c => {
          const cls = `${s.headCell} ${c.key === 'amount' ? s.right : ''}`;
          const arrow = sort?.key === c.key ? (sort.dir === 'asc' ? ' ↑' : ' ↓') : '';
          return onSort
            ? <button key={c.key} type="button" className={cls} onClick={() => onSort(c.key)} aria-label={`Sort by ${c.label}`}>{c.label}{arrow}</button>
            : <span key={c.key} className={cls}>{c.label}</span>;
        })}
      </div>
      <ul>
        {rows.map(tx => {
          const v = txVisual(tx);
          const effect = txEffect(tx);
          const account = accountNames ? accountNames[tx.accountId] ?? '—' : null;
          const when = formatRelativeDay(tx.date, today);
          const content = (
            <>
              <span className={s.desc}>
                <span className="emoji-circle">{v.emoji}</span>
                <span>
                  <span className={s.title}>{tx.description}</span>
                  <span className={s.meta}>{v.label} · {when}{account ? ` · ${account}` : ''}</span>
                </span>
              </span>
              <span className={s.cell}><span className="chip chip-sm">{v.emoji} {v.label}</span></span>
              {account !== null && <span className={`${s.cell} muted`}>{account}</span>}
              <span className={`${s.cell} muted`}>{when}</span>
              <span className={`${s.amount} tabular ${effect > 0 ? 'amount-in' : ''}`}>{formatMoney(effect, currency, { sign: true })}</span>
            </>
          );
          return (
            <li key={tx.id}>
              {onSelect
                ? <button type="button" className={s.row} onClick={() => onSelect(tx)} title={tx.type === 'transfer' ? 'Delete transfer' : 'Edit'}>{content}</button>
                : <div className={s.row}>{content}</div>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
