import { useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { Payment } from '../types';
import BarChart from '../charts/BarChart';
import DonutChart from '../charts/DonutChart';
import LineChart from '../charts/LineChart';
import EmptyState from '../components/EmptyState';
import Icon from '../components/Icon';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import TransactionList from '../components/TransactionList';
import { useCountUp } from '../components/useCountUp';
import { useLayout } from '../components/layout/layoutContext';
import { CATEGORIES } from '../lib/categories';
import { addDays, monthKey, startOfMonth } from '../lib/dates';
import {
  balanceAt, balanceSeries, categoryBreakdown, dueLabel, insights, monthlySeries, paymentStatus, percentChange,
  rangeTotals, samePeriodLastMonth, savingsRate, sortByDateDesc, totalBalance, upcomingBills,
} from '../lib/finance';
import { formatMoney, formatPercent } from '../lib/format';
import { newId } from '../state/financeReducer';
import { useFinance } from '../state/FinanceContext';
import s from './DashboardPage.module.css';

function Kpi({ label, value, emoji, children }: { label: string; value: string; emoji: string; children: ReactNode }) {
  return (
    <div className={`card ${s.kpi}`}>
      <div>
        <p className="label">{label}</p>
        <p className={`${s.kpiValue} tabular`}>{value}</p>
      </div>
      {children}
      <span className="card-emoji" aria-hidden="true">{emoji}</span>
    </div>
  );
}

function Delta({ value, goodWhenUp = true }: { value: number | null; goodWhenUp?: boolean }) {
  if (value === null) return <span className={s.delta}>New this month</span>;
  const up = value >= 0;
  return <span className={`${s.delta} ${up === goodWhenUp ? s.good : s.bad}`}>{up ? '▲' : '▼'} {Math.abs(Math.round(value))}% vs last month</span>;
}

function BillRow({ payment }: { payment: Payment }) {
  const { data, dispatch, today } = useFinance();
  const status = paymentStatus(payment, today);
  return (
    <li className={s.bill}>
      <div className={s.billInfo}>
        <span className="emoji-circle">{CATEGORIES[payment.category].emoji}</span>
        <div>
          <p className={s.billName}>{payment.name}</p>
          <p className="muted small">{dueLabel(payment, today)}</p>
        </div>
      </div>
      <div className={s.billRight}>
        <span className={`${s.billAmount} tabular`}>{formatMoney(payment.amount, data.profile.currency)}</span>
        {status === 'paid'
          ? <StatusBadge status={status} />
          : <button className="btn btn-secondary btn-sm" onClick={() => dispatch({ type: 'payBill', paymentId: payment.id, txId: newId(), today })}>Mark paid</button>}
      </div>
    </li>
  );
}

export default function DashboardPage() {
  const { data, today } = useFinance();
  const { openQuickAdd } = useLayout();
  const [range, setRange] = useState<7 | 30 | 90>(90);
  const cur = data.profile.currency;

  const kpi = useMemo(() => {
    const now = rangeTotals(data.transactions, startOfMonth(today), today);
    const { from, to } = samePeriodLastMonth(today);
    const prev = rangeTotals(data.transactions, from, to);
    const total = totalBalance(data, today);
    return {
      now, prev, total,
      balanceDelta: percentChange(total, balanceAt(data, addDays(today, -30))),
      rate: savingsRate(data.transactions, monthKey(today)),
    };
  }, [data, today]);
  const series = useMemo(() => balanceSeries(data, today, range), [data, today, range]);
  const monthly = useMemo(() => monthlySeries(data.transactions, today, 6), [data.transactions, today]);
  const breakdown = useMemo(() => categoryBreakdown(data.transactions, startOfMonth(today), today), [data.transactions, today]);
  const tips = useMemo(() => insights(data, today), [data, today]);
  const recent = useMemo(() => sortByDateDesc(data.transactions).slice(0, 5), [data.transactions]);
  const bills = useMemo(() => upcomingBills(data.payments, today, 3), [data.payments, today]);
  const balance = useCountUp(kpi.total);

  return (
    <div className="page">
      <PageHeader title={`Hey ${data.profile.nickname || 'there'} 👋`} subtitle="Here's your money this month">
        <button className={`btn btn-primary btn-glow ${s.addBtn}`} onClick={openQuickAdd} data-tour="quick-add">
          <Icon name="plus" /> Add transaction
        </button>
      </PageHeader>

      <section className={s.kpis} aria-label="Summary">
        <div className={`card ${s.kpi} ${s.hero}`} data-tour="balance">
          <div>
            <p className="label">Total balance</p>
            <p className={`${s.heroValue} tabular`}>{formatMoney(balance, cur)}</p>
          </div>
          {kpi.balanceDelta !== null && (
            <span className={s.heroChip}>{kpi.balanceDelta >= 0 ? '▲' : '▼'} {Math.abs(kpi.balanceDelta).toFixed(1)}% vs last month</span>
          )}
          <span className="card-emoji" aria-hidden="true">💸</span>
        </div>
        <Kpi label="Income this month" value={formatMoney(kpi.now.income, cur)} emoji="💰">
          <Delta value={percentChange(kpi.now.income, kpi.prev.income)} />
        </Kpi>
        <Kpi label="Expenses this month" value={formatMoney(kpi.now.expense, cur)} emoji="🧾">
          <Delta value={percentChange(kpi.now.expense, kpi.prev.expense)} goodWhenUp={false} />
        </Kpi>
        <Kpi label="Savings rate" value={formatPercent(kpi.rate)} emoji="🏦">
          <div className={s.meter} role="presentation"><div style={{ width: `${Math.max(0, Math.min(100, kpi.rate))}%` }} /></div>
        </Kpi>
      </section>

      {tips.length > 0 && (
        <div className={s.insights}>
          {tips.map(t => <span key={t.text} className={`chip ${s[t.tone]}`}>{t.emoji} {t.text}</span>)}
        </div>
      )}

      <section className="card" data-tour="charts">
        <div className="card-head">
          <h2 className="card-title">Balance over time</h2>
          <div className="segmented" role="group" aria-label="Range">
            {([90, 30, 7] as const).map(r => (
              <button key={r} type="button" aria-pressed={range === r} onClick={() => setRange(r)}>{r}D</button>
            ))}
          </div>
        </div>
        <LineChart data={series} currency={cur} />
      </section>

      <div className={s.split}>
        <section className="card">
          <div className="card-head">
            <h2 className="card-title">Income vs expenses</h2>
            <div className={s.legend}>
              <span><i style={{ background: 'var(--lime)' }} />Income</span>
              <span><i style={{ background: 'var(--pink)' }} />Expenses</span>
            </div>
          </div>
          <BarChart data={monthly} currency={cur} />
        </section>
        <section className="card">
          <div className="card-head"><h2 className="card-title">Spending by category</h2></div>
          {breakdown.length
            ? <DonutChart data={breakdown} currency={cur} />
            : <EmptyState emoji="🧾" title="No spending yet" text="This month's expenses show up here." />}
        </section>
      </div>

      <div className={s.split}>
        <section className="card card-flush">
          <div className="card-head pad">
            <h2 className="card-title">Recent transactions</h2>
            <Link to="/transactions">See all</Link>
          </div>
          {recent.length
            ? <TransactionList rows={recent} currency={cur} today={today} />
            : <EmptyState emoji="✨" title="No transactions yet" text="Tap + to add your first one." />}
        </section>
        <section className="card">
          <div className="card-head">
            <h2 className="card-title">Upcoming bills</h2>
            <Link to="/payments">See all</Link>
          </div>
          {bills.length
            ? <ul className={s.bills}>{bills.map(p => <BillRow key={p.id} payment={p} />)}</ul>
            : data.payments.length
              ? <EmptyState emoji="😎" title="Nothing due. Nice 😎" text="All your bills are paid up." />
              : <EmptyState emoji="🧘" title="No bills yet" text="Add rent and subscriptions in Payments." />}
        </section>
      </div>
    </div>
  );
}
