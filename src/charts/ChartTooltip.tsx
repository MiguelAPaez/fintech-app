import type { ReactNode } from 'react';

export interface Tip { x: number; y: number; content: ReactNode }

export default function ChartTooltip({ tip }: { tip: Tip | null }) {
  if (!tip) return null;
  return <div className="chart-tooltip" style={{ left: tip.x, top: tip.y }}>{tip.content}</div>;
}
