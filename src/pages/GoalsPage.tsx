import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { Goal } from '../types';
import ProgressRing from '../charts/ProgressRing';
import Icon from '../components/Icon';
import PageHeader from '../components/PageHeader';
import { formatDateLong, formatMoney } from '../lib/format';
import { useFinance } from '../state/FinanceContext';
import FundModal from './FundModal';
import GoalModal from './GoalModal';
import s from './GoalsPage.module.css';

const BURST = ['🎉', '✨', '💜', '🎊', '⭐', '💚'];

function GoalCard({ goal, onFund }: { goal: Goal; onFund: () => void }) {
  const { data, dispatch, today } = useFinance();
  const cur = data.profile.currency;
  const done = goal.saved >= goal.target;
  const wasDone = useRef(done);
  const [celebrate, setCelebrate] = useState(false);

  useEffect(() => {
    const justFinished = done && !wasDone.current;
    wasDone.current = done;
    if (!justFinished) return;
    setCelebrate(true);
    const t = setTimeout(() => setCelebrate(false), 1600);
    return () => clearTimeout(t);
  }, [done]);

  return (
    <article className={`card ${s.goal}`}>
      {celebrate && (
        <div className={s.burst} aria-hidden="true">
          {BURST.map((e, i) => <span key={i} style={{ '--i': i } as CSSProperties}>{e}</span>)}
        </div>
      )}
      <div className={s.top}>
        <span className={s.emoji} aria-hidden="true">{goal.emoji}</span>
        <button className="icon-btn" aria-label={`Delete ${goal.name}`}
          onClick={() => { if (confirm(`Delete "${goal.name}"?`)) dispatch({ type: 'deleteGoal', id: goal.id }); }}>
          <Icon name="trash" size={18} />
        </button>
      </div>
      <h2 className="card-title">{goal.name}</h2>
      <ProgressRing value={goal.target ? goal.saved / goal.target : 0} />
      <p className="tabular"><strong>{formatMoney(goal.saved, cur)}</strong> <span className="muted">of {formatMoney(goal.target, cur)}</span></p>
      {goal.deadline && (
        <p className="muted small">By {formatDateLong(goal.deadline)}{goal.deadline < today && !done ? ' · past the date' : ''}</p>
      )}
      {done
        ? <p className={s.done} role="status">🎉 Goal crushed!</p>
        : <button className="btn btn-secondary" onClick={onFund}>Add money</button>}
    </article>
  );
}

export default function GoalsPage() {
  const { data } = useFinance();
  const [creating, setCreating] = useState(false);
  const [funding, setFunding] = useState<Goal | null>(null);
  const cur = data.profile.currency;
  const saved = data.goals.reduce((sum, g) => sum + g.saved, 0);
  const target = data.goals.reduce((sum, g) => sum + g.target, 0);

  return (
    <div className="page">
      <PageHeader title="Goals 🎯" subtitle={data.goals.length ? `${formatMoney(saved, cur)} saved of ${formatMoney(target, cur)}` : 'Save up for the things you want'}>
        <button className="btn btn-primary" onClick={() => setCreating(true)}><Icon name="plus" /> New goal</button>
      </PageHeader>
      <div className={s.grid}>
        {data.goals.map(g => <GoalCard key={g.id} goal={g} onFund={() => setFunding(g)} />)}
        <button className={s.newCard} onClick={() => setCreating(true)}><span aria-hidden="true">➕</span>New goal</button>
      </div>
      {creating && <GoalModal onClose={() => setCreating(false)} />}
      {funding && <FundModal goal={funding} onClose={() => setFunding(null)} />}
    </div>
  );
}
