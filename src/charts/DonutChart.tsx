import { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import type { Currency } from '../types';
import type { CategoryTotal } from '../lib/finance';
import { CATEGORIES } from '../lib/categories';
import { formatMoney } from '../lib/format';
import { motionMs } from '../lib/motion';
import ChartTooltip, { type Tip } from './ChartTooltip';

interface Slice { key: string; label: string; emoji: string; color: string; total: number }

function toSlices(data: CategoryTotal[]): Slice[] {
  const slices = data.map(d => ({ key: d.category, ...CATEGORIES[d.category], total: d.total }));
  if (slices.length <= 5) return slices;
  const rest = d3.sum(slices.slice(4), s => s.total);
  return [...slices.slice(0, 4), { key: 'rest', label: 'Everything else', emoji: '➕', color: 'var(--text-muted)', total: rest }];
}

interface Props { data: CategoryTotal[]; currency: Currency; size?: number; legend?: boolean }

export default function DonutChart({ data, currency, size = 180, legend = true }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tip, setTip] = useState<Tip | null>(null);
  const slices = useMemo(() => toSlices(data), [data]);
  const total = d3.sum(slices, s => s.total);

  useEffect(() => {
    const svg = d3.select(svgRef.current!);
    svg.selectAll('*').remove();
    const r = size / 2;
    const g = svg.append('g').attr('transform', `translate(${r},${r})`);
    if (total === 0) {
      g.append('circle').attr('r', r * 0.85).style('fill', 'none').style('stroke', 'var(--surface-2)').style('stroke-width', r * 0.3);
      return;
    }
    const arc = d3.arc<d3.PieArcDatum<Slice>>().innerRadius(r * 0.7).outerRadius(r).cornerRadius(4).padAngle(0.02);
    const pie = d3.pie<Slice>().value(s => s.total).sort(null);
    g.selectAll('path').data(pie(slices)).join('path')
      .style('fill', d => d.data.color)
      .on('pointerenter', (_event, d) => {
        const [cx, cy] = arc.centroid(d);
        setTip({ x: r + cx, y: r + cy, content: <>{d.data.emoji} {d.data.label}: <strong>{formatMoney(d.data.total, currency)}</strong></> });
      })
      .on('pointerleave', () => setTip(null))
      .transition().duration(motionMs(700)).ease(d3.easeCubicOut)
      .attrTween('d', d => {
        const i = d3.interpolate({ ...d, endAngle: d.startAngle }, d);
        return t => arc(i(t)) ?? '';
      });
  }, [slices, total, size, currency]);

  return (
    <div className="donut">
      <div className="donut-ring" style={{ width: size, height: size }} role="img" aria-label={`Spending by category, total ${formatMoney(total, currency)}`}>
        <svg ref={svgRef} width={size} height={size} />
        <div className="donut-center">
          <span className="label">Total</span>
          <strong className="tabular">{formatMoney(total, currency, { compact: total >= 100_000 })}</strong>
        </div>
        <ChartTooltip tip={tip} />
      </div>
      {legend && total > 0 && (
        <ul className="donut-legend">
          {slices.map(s => (
            <li key={s.key}>
              <span className="dot" style={{ background: s.color }} />
              <span>{s.emoji} {s.label}</span>
              <span className="tabular">{Math.round((s.total / total) * 100)}%</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
