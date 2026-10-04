import type { PaymentStatus } from '../types';

const LABEL: Record<PaymentStatus, string> = { paid: '✓ Paid', upcoming: '● Upcoming', overdue: '! Overdue' };

export default function StatusBadge({ status }: { status: PaymentStatus }) {
  return <span className={`badge badge-${status}`}>{LABEL[status]}</span>;
}
