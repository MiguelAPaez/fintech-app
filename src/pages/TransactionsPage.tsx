import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Transaction } from '../types';
import EmptyState from '../components/EmptyState';
import FilterBar from '../components/FilterBar';
import Icon from '../components/Icon';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';
import TransactionList from '../components/TransactionList';
import TransactionModal from '../components/TransactionModal';
import { downloadCsv, toCsv } from '../lib/csv';
import { activeFilterCount, applyFilters, filtersFromParams, filtersToParams, paginate, sortTxs, type Filters, type SortKey } from '../lib/filters';
import { txEffect } from '../lib/finance';
import { formatMoney } from '../lib/format';
import { useFinance } from '../state/FinanceContext';
import s from './TransactionsPage.module.css';

export default function TransactionsPage() {
  const { data, dispatch, today } = useFinance();
  const [params, setParams] = useSearchParams();
  const [editing, setEditing] = useState<Transaction | 'new' | null>(null);
  const [sheet, setSheet] = useState(false);
  const cur = data.profile.currency;

  const filters = useMemo(() => filtersFromParams(params), [params]);
  const accountNames = useMemo(() => Object.fromEntries(data.accounts.map(a => [a.id, a.name])), [data.accounts]);
  const filtered = useMemo(
    () => sortTxs(applyFilters(data.transactions, filters, today), filters.sort, accountNames),
    [data.transactions, filters, today, accountNames],
  );
  const page = paginate(filtered, filters.page, filters.pageSize);
  const count = activeFilterCount(filters);
  const net = filtered.reduce((sum, t) => sum + (t.type === 'transfer' ? 0 : txEffect(t)), 0);

  const update = (patch: Partial<Filters>) => setParams(filtersToParams({ ...filters, page: 1, ...patch }), { replace: true });
  const reset = () => setParams(new URLSearchParams(), { replace: true });
  const onSort = (key: SortKey) => update({
    sort: {
      key,
      dir: filters.sort.key === key
        ? (filters.sort.dir === 'asc' ? 'desc' : 'asc')
        : (key === 'date' || key === 'amount' ? 'desc' : 'asc'),
    },
  });
  const onSelect = (tx: Transaction) => {
    if (tx.type !== 'transfer') return setEditing(tx);
    if (confirm('Delete this transfer? Both sides will be removed.')) dispatch({ type: 'deleteTx', id: tx.id });
  };

  const bar = <FilterBar filters={filters} accounts={data.accounts} onChange={update} onReset={reset} />;

  return (
    <div className="page">
      <PageHeader title="Transactions" subtitle={`${filtered.length} result${filtered.length === 1 ? '' : 's'} · net ${formatMoney(net, cur, { sign: true })}`}>
        <button className="btn btn-secondary" disabled={!filtered.length}
          onClick={() => downloadCsv(`pulse-transactions-${today}.csv`, toCsv(filtered, accountNames))}>
          <Icon name="download" /> Export CSV
        </button>
        <button className="btn btn-primary" onClick={() => setEditing('new')}><Icon name="plus" /> Add</button>
      </PageHeader>

      <div className={`card ${s.filtersDesktop}`}>{bar}</div>
      <button className={`btn btn-secondary ${s.filtersButton}`} onClick={() => setSheet(true)}>
        <Icon name="filter" /> Filters{count ? ` (${count})` : ''}
      </button>

      <section className="card card-flush">
        {page.total === 0 ? (
          <EmptyState emoji="🔍" title="Nothing matches" text="Try a wider date range or fewer filters.">
            {count > 0 && <button className="btn btn-secondary" onClick={reset}>Clear filters</button>}
          </EmptyState>
        ) : (
          <TransactionList rows={page.rows} currency={cur} today={today} accountNames={accountNames}
            sort={filters.sort} onSort={onSort} onSelect={onSelect} />
        )}
      </section>

      {page.totalPages > 1 && (
        <nav className={s.pager} aria-label="Pagination">
          <button className="btn btn-secondary" disabled={page.page <= 1} onClick={() => update({ page: page.page - 1 })}><Icon name="chevron-left" /> Prev</button>
          <span className="muted">Page {page.page} of {page.totalPages}</span>
          <button className="btn btn-secondary" disabled={page.page >= page.totalPages} onClick={() => update({ page: page.page + 1 })}>Next <Icon name="chevron-right" /></button>
        </nav>
      )}

      {sheet && (
        <Modal title="Filters" variant="sheet" onClose={() => setSheet(false)}>
          {bar}
          <button className="btn btn-primary btn-block" onClick={() => setSheet(false)}>Show {filtered.length} results</button>
        </Modal>
      )}
      {editing && <TransactionModal tx={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} />}
    </div>
  );
}
