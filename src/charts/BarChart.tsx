import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import type { Currency } from '../types';
import type { MonthPoint } from '../lib/finance';
import { formatMoney, formatMonth } from '../lib/format';
import { motionMs } from '../lib/motion';
import ChartTooltip, { type Tip } from './ChartTooltip';
import { useChartWidth } from './useChartSize';

const KEYS = ['income', 'expense'] as const;
type Key = (typeof KEYS)[number];

export default function BarChart({ data, currency, height = 240 }: { data: MonthPoint[]; currency: Currency; height?: number }) {
  const [wrapRef, width] = useChartWidth<HTMLDivElement>();
  const svgRef = useRef<SVGSVGElement>(null);
  const [tip, setTip] = useState<Tip | null>(null);

  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;
    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();
    if (width === 0) return;
    const m = { top: 12, right: 8, bottom: 28, left: 8 };

    const x0 = d3.scaleBand<string>().domain(data.map(d => d.month)).range([m.left, width - m.right]).paddingInner(0.35).paddingOuter(0.2);
    const groupWidth = Math.min(x0.bandwidth(), 64);
    const offset = (x0.bandwidth() - groupWidth) / 2;
    const x1 = d3.scaleBand<Key>().domain(KEYS).range([0, groupWidth]).padding(0.12);
    const max = d3.max(data, d => Math.max(d.income, d.expense)) || 1;
    const y = d3.scaleLinear().domain([0, max]).nice(3).range([height - m.bottom, m.top]);
    const ms = motionMs();

    svg.append('g').selectAll('line').data(y.ticks(3)).join('line')
      .attr('class', 'grid-line').attr('x1', m.left).attr('x2', width - m.right).attr('y1', d => y(d)).attr('y2', d => y(d));

    svg.append('g').selectAll('g').data(data).join('g')
      .attr('transform', d => `translate(${x0(d.month)! + offset},0)`)
      .selectAll('rect')
      .data(d => KEYS.map(key => ({ key, month: d.month, value: d[key] })))
      .join('rect')
      .attr('class', d => `bar-${d.key}`)
      .attr('x', d => x1(d.key)!).attr('width', x1.bandwidth()).attr('rx', 4)
      .attr('y', y(0)).attr('height', 0)
      .on('pointerenter', (_event, d) => setTip({
        x: x0(d.month)! + offset + x1(d.key)! + x1.bandwidth() / 2,
        y: y(d.value),
        content: <>{d.key === 'income' ? 'Income' : 'Expenses'} · {formatMonth(d.month)}: <strong>{formatMoney(d.value, currency)}</strong></>,
      }))
      .on('pointerleave', () => setTip(null))
      .transition().duration(ms).delay((_d, i) => ms ? i * 60 : 0).ease(d3.easeCubicOut)
      .attr('y', d => y(d.value)).attr('height', d => y(0) - y(d.value));

    svg.append('g').selectAll('text').data(data).join('text')
      .attr('class', 'axis-label').attr('x', d => x0(d.month)! + x0.bandwidth() / 2).attr('y', height - 6)
      .attr('text-anchor', 'middle').text(d => formatMonth(d.month));
  }, [data, width, height, currency]);

  return (
    <div ref={wrapRef} className="chart" style={{ height }} role="img"
      aria-label={`Income versus expenses for the last ${data.length} months`}>
      <svg ref={svgRef} width={width} height={height} />
      <ChartTooltip tip={tip} />
    </div>
  );
}
