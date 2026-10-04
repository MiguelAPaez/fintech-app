import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { motionMs } from '../lib/motion';
import { useChartWidth } from './useChartSize';

export default function Sparkline({ data, color = 'var(--violet)', height = 44 }: { data: number[]; color?: string; height?: number }) {
  const [wrapRef, width] = useChartWidth<HTMLDivElement>();
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    if (width === 0 || data.length < 2) return;
    const x = d3.scaleLinear().domain([0, data.length - 1]).range([2, width - 2]);
    const [lo, hi] = d3.extent(data) as [number, number];
    const y = d3.scaleLinear().domain(lo === hi ? [lo - 1, hi + 1] : [lo, hi]).range([height - 4, 4]);
    const line = d3.line<number>().x((_d, i) => x(i)).y(d => y(d)).curve(d3.curveMonotoneX);
    const path = svg.append('path').datum(data).attr('d', line)
      .style('fill', 'none').style('stroke', color).style('stroke-width', 2).style('stroke-linecap', 'round');
    const len = path.node()!.getTotalLength();
    path.attr('stroke-dasharray', `${len} ${len}`).attr('stroke-dashoffset', len)
      .transition().duration(motionMs()).attr('stroke-dashoffset', 0);
  }, [data, width, height, color]);

  return <div ref={wrapRef} style={{ height }} aria-hidden="true"><svg ref={svgRef} width={width} height={height} /></div>;
}
