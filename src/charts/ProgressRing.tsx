import { useEffect, useId, useRef } from 'react';
import * as d3 from 'd3';
import { motionMs } from '../lib/motion';

export default function ProgressRing({ value, size = 120, stroke = 10 }: { value: number; size?: number; stroke?: number }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const prev = useRef(0);
  const gradId = `ring-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const pct = Math.max(0, Math.min(1, value));

  useEffect(() => {
    const svg = d3.select(svgRef.current!);
    svg.selectAll('*').remove();
    const r = size / 2;
    const grad = svg.append('defs').append('linearGradient').attr('id', gradId).attr('x1', '0%').attr('x2', '100%');
    grad.append('stop').attr('offset', '0%').style('stop-color', 'var(--violet)');
    grad.append('stop').attr('offset', '100%').style('stop-color', 'var(--pink)');
    const g = svg.append('g').attr('transform', `translate(${r},${r})`);
    const arc = d3.arc<{ endAngle: number }>().innerRadius(r - stroke).outerRadius(r).startAngle(0).cornerRadius(stroke / 2);
    g.append('path').attr('d', arc({ endAngle: Math.PI * 2 })).style('fill', 'var(--surface-2)');
    const from = prev.current;
    prev.current = pct;
    g.append('path').style('fill', `url(#${gradId})`)
      .transition().duration(motionMs()).ease(d3.easeCubicOut)
      .attrTween('d', () => {
        const i = d3.interpolate(from * Math.PI * 2, pct * Math.PI * 2);
        return t => arc({ endAngle: i(t) }) ?? '';
      });
  }, [pct, size, stroke, gradId]);

  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg ref={svgRef} width={size} height={size} role="img" aria-label={`${Math.round(pct * 100)}% saved`} />
      <span className="ring-label">{Math.round(pct * 100)}%</span>
    </div>
  );
}
