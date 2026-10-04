import { useEffect, useId, useRef, useState } from 'react';
import * as d3 from 'd3';
import type { Currency } from '../types';
import type { BalancePoint } from '../lib/finance';
import { isoToDate } from '../lib/dates';
import { formatDate, formatMoney } from '../lib/format';
import { motionMs } from '../lib/motion';
import ChartTooltip, { type Tip } from './ChartTooltip';
import { useChartWidth } from './useChartSize';

interface P { date: Date; iso: string; value: number }

export default function LineChart({ data, currency, height = 280 }: { data: BalancePoint[]; currency: Currency; height?: number }) {
  const [wrapRef, width] = useChartWidth<HTMLDivElement>();
  const svgRef = useRef<SVGSVGElement>(null);
  const gradId = `line-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const [tip, setTip] = useState<Tip | null>(null);

  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;
    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();
    if (width === 0 || data.length < 2) {
      setTip(null);
      return;
    }
    const m = { top: 16, right: 12, bottom: 28, left: 12 };

    const points: P[] = data.map(d => ({ date: isoToDate(d.date), iso: d.date, value: d.balance }));
    const x = d3.scaleUtc().domain([points[0].date, points[points.length - 1].date]).range([m.left, width - m.right]);
    const lo = d3.min(points, p => p.value)!;
    const hi = d3.max(points, p => p.value)!;
    const pad = (hi - lo) * 0.15 || Math.abs(hi) * 0.1 || 1;
    const y = d3.scaleLinear().domain([lo - pad, hi + pad]).nice(4).range([height - m.bottom, m.top]);

    const grad = svg.append('defs').append('linearGradient').attr('id', gradId).attr('x1', 0).attr('y1', 0).attr('x2', 0).attr('y2', 1);
    grad.append('stop').attr('offset', '0%').style('stop-color', 'var(--violet)').style('stop-opacity', 0.3);
    grad.append('stop').attr('offset', '100%').style('stop-color', 'var(--violet)').style('stop-opacity', 0);

    svg.append('g').selectAll('line').data(y.ticks(4)).join('line')
      .attr('class', 'grid-line').attr('x1', m.left).attr('x2', width - m.right).attr('y1', d => y(d)).attr('y2', d => y(d));

    const tickFormat = d3.utcFormat(data.length > 45 ? '%b' : '%b %d');
    svg.append('g').selectAll('text').data(x.ticks(width < 500 ? 3 : 6)).join('text')
      .attr('class', 'axis-label').attr('x', d => x(d)).attr('y', height - 6).attr('text-anchor', 'middle').text(d => tickFormat(d));

    const area = d3.area<P>().x(p => x(p.date)).y0(height - m.bottom).y1(p => y(p.value)).curve(d3.curveMonotoneX);
    const line = d3.line<P>().x(p => x(p.date)).y(p => y(p.value)).curve(d3.curveMonotoneX);
    svg.append('path').datum(points).attr('d', area).style('fill', `url(#${gradId})`);
    const path = svg.append('path').datum(points).attr('class', 'line-path').attr('d', line);
    const len = path.node()!.getTotalLength();
    path.attr('stroke-dasharray', `${len} ${len}`).attr('stroke-dashoffset', len)
      .transition().duration(motionMs()).ease(d3.easeCubicOut).attr('stroke-dashoffset', 0);

    const focus = svg.append('g').style('display', 'none');
    focus.append('line').attr('class', 'crosshair').attr('y1', m.top).attr('y2', height - m.bottom);
    const dot = focus.append('circle').attr('class', 'focus-dot').attr('r', 5);
    const bisect = d3.bisector<P, Date>(p => p.date).center;

    svg.append('rect').attr('x', m.left).attr('width', width - m.left - m.right).attr('height', height).style('fill', 'transparent')
      .on('pointermove', (event: PointerEvent) => {
        const p = points[bisect(points, x.invert(d3.pointer(event)[0]))];
        focus.style('display', null).attr('transform', `translate(${x(p.date)},0)`);
        dot.attr('cy', y(p.value));
        setTip({ x: x(p.date), y: y(p.value), content: <><strong>{formatMoney(p.value, currency)}</strong> <span className="muted">{formatDate(p.iso)}</span></> });
      })
      .on('pointerleave', () => {
        focus.style('display', 'none');
        setTip(null);
      });
  }, [data, width, height, currency, gradId]);

  const first = data[0]?.balance ?? 0;
  const last = data.at(-1)?.balance ?? 0;
  return (
    <div ref={wrapRef} className="chart" style={{ height }} role="img"
      aria-label={`Balance over the last ${data.length} days, from ${formatMoney(first, currency)} to ${formatMoney(last, currency)}`}>
      <svg ref={svgRef} width={width} height={height} />
      <ChartTooltip tip={tip} />
    </div>
  );
}
