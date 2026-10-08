import React, { useEffect, useRef, useState } from 'react';

// Lightweight SVG charts (no chart library). Single series, one y-axis,
// recessive grid, 2px lines, rounded bar ends, hover tooltip on every chart.
// Charts measure their container so text stays the same size at any width.

export interface Point {
  label: string; // x-axis label
  value: number | null;
  tooltip?: string;
}

const H = 200;
const PAD = { top: 26, right: 12, bottom: 26, left: 38 };
const INK = '#4f46e5'; // indigo-600 (brand)
const GRID = '#e2e8f0'; // slate-200
const MUTED = '#64748b'; // slate-500

const niceMax = (max: number) => {
  if (max <= 0) return 10;
  const pow = Math.pow(10, Math.floor(Math.log10(max)));
  const n = max / pow;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * pow;
};

const formatTick = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1));

// Width of the wrapping element, kept in sync with resizes.
const useWidth = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setWidth(Math.max(240, Math.round(el.getBoundingClientRect().width)));
    update();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, width };
};

const Axis: React.FC<{ w: number; yMax: number; unit?: string }> = ({ w, yMax, unit = '' }) => {
  const ticks = [0, yMax / 2, yMax];
  const plotH = H - PAD.top - PAD.bottom;
  return (
    <g>
      {ticks.map(t => {
        const y = PAD.top + plotH - (t / yMax) * plotH;
        return (
          <g key={t}>
            <line x1={PAD.left} x2={w - PAD.right} y1={y} y2={y} stroke={GRID} strokeWidth={1} />
            <text x={PAD.left - 6} y={y + 3} textAnchor="end" fontSize={10} fill={MUTED}>{formatTick(t)}{unit}</text>
          </g>
        );
      })}
    </g>
  );
};

const Tooltip: React.FC<{ w: number; x: number; text: string }> = ({ w, x, text }) => {
  const width = Math.min(w - 4, Math.max(60, text.length * 6.2 + 16));
  const left = Math.min(Math.max(x - width / 2, 2), w - width - 2);
  return (
    <g pointerEvents="none">
      <rect x={left} y={0} width={width} height={22} rx={6} fill="#0f172a" opacity={0.92} />
      <text x={left + width / 2} y={15} textAnchor="middle" fontSize={11} fill="#fff">{text}</text>
    </g>
  );
};

// Show at most ~one label per 90px, always including the last.
const xLabels = (points: Point[], xFor: (i: number) => number, w: number) => {
  const maxLabels = Math.max(2, Math.floor((w - PAD.left - PAD.right) / 90));
  const every = Math.max(1, Math.ceil(points.length / maxLabels));
  return points.map((p, i) =>
    i % every === 0 || i === points.length - 1 ? (
      <text
        key={i}
        x={xFor(i)}
        y={H - 8}
        // Edge labels anchor inward so they never clip at the chart border.
        textAnchor={points.length > 1 && i === points.length - 1 && xFor(i) > w - PAD.right - 30 ? 'end' : 'middle'}
        fontSize={10}
        fill={MUTED}
      >
        {p.label}
      </text>
    ) : null
  );
};

export const LineChart: React.FC<{ points: Point[]; yMax?: number; unit?: string; ariaLabel: string }> = ({ points, yMax, unit, ariaLabel }) => {
  const { ref, width: w } = useWidth();
  const [index, setIndex] = useState<number | null>(null);
  const values = points.map(p => p.value).filter((v): v is number => v !== null);
  const max = yMax ?? niceMax(Math.max(...values, 1));
  const plotW = w - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const xFor = (i: number) => PAD.left + (points.length > 1 ? (i / (points.length - 1)) * plotW : plotW / 2);
  const yFor = (v: number) => PAD.top + plotH - (Math.min(v, max) / max) * plotH;

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!points.length) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const i = points.length > 1 ? Math.round(((x - PAD.left) / plotW) * (points.length - 1)) : 0;
    setIndex(Math.max(0, Math.min(points.length - 1, i)));
  };

  let d = '';
  points.forEach((p, i) => {
    if (p.value === null) return;
    d += `${d === '' || points[i - 1]?.value === null ? 'M' : 'L'}${xFor(i).toFixed(1)},${yFor(p.value).toFixed(1)} `;
  });
  const hovered = index !== null ? points[index] : null;

  return (
    <div ref={ref} className="w-full">
      <svg width={w} height={H} viewBox={`0 0 ${w} ${H}`} role="img" aria-label={ariaLabel} onMouseMove={onMove} onMouseLeave={() => setIndex(null)} className="block">
        <Axis w={w} yMax={max} unit={unit} />
        {xLabels(points, xFor, w)}
        <path d={d} fill="none" stroke={INK} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {points.length <= 40 && points.map((p, i) => p.value === null ? null : (
          <circle key={i} cx={xFor(i)} cy={yFor(p.value)} r={3} fill={INK} stroke="#fff" strokeWidth={2} />
        ))}
        {hovered && index !== null && (
          <g pointerEvents="none">
            <line x1={xFor(index)} x2={xFor(index)} y1={PAD.top} y2={H - PAD.bottom} stroke={MUTED} strokeWidth={1} strokeDasharray="3 3" />
            {hovered.value !== null && <circle cx={xFor(index)} cy={yFor(hovered.value)} r={5} fill={INK} stroke="#fff" strokeWidth={2} />}
            <Tooltip w={w} x={xFor(index)} text={hovered.tooltip || `${hovered.label}: ${hovered.value === null ? '—' : `${hovered.value}${unit || ''}`}`} />
          </g>
        )}
      </svg>
    </div>
  );
};

export const BarChart: React.FC<{ points: Point[]; yMax?: number; unit?: string; ariaLabel: string }> = ({ points, yMax, unit, ariaLabel }) => {
  const { ref, width: w } = useWidth();
  const [index, setIndex] = useState<number | null>(null);
  const values = points.map(p => p.value || 0);
  const max = yMax ?? niceMax(Math.max(...values, 1));
  const plotW = w - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const slot = plotW / Math.max(1, points.length);
  const barW = Math.min(36, slot * 0.6);
  const xFor = (i: number) => PAD.left + slot * i + slot / 2;
  const hovered = index !== null ? points[index] : null;

  return (
    <div ref={ref} className="w-full">
      <svg width={w} height={H} viewBox={`0 0 ${w} ${H}`} role="img" aria-label={ariaLabel} onMouseLeave={() => setIndex(null)} className="block">
        <Axis w={w} yMax={max} unit={unit} />
        {xLabels(points, xFor, w)}
        {points.map((p, i) => {
          const v = Math.min(p.value || 0, max);
          const h = (v / max) * plotH;
          const x = xFor(i) - barW / 2;
          const y = PAD.top + plotH - h;
          const r = Math.min(4, h / 2, barW / 2);
          // Rounded top, square base anchored to the baseline.
          const path = h > 0
            ? `M${x},${y + h} L${x},${y + r} Q${x},${y} ${x + r},${y} L${x + barW - r},${y} Q${x + barW},${y} ${x + barW},${y + r} L${x + barW},${y + h} Z`
            : '';
          return (
            <g key={i} onMouseEnter={() => setIndex(i)}>
              {/* Hit target larger than the mark */}
              <rect x={xFor(i) - slot / 2} y={PAD.top} width={slot} height={plotH} fill="transparent" />
              {path && <path d={path} fill={INK} opacity={index === null || index === i ? 1 : 0.55} />}
            </g>
          );
        })}
        {hovered && index !== null && (
          <Tooltip w={w} x={xFor(index)} text={hovered.tooltip || `${hovered.label}: ${hovered.value ?? 0}${unit || ''}`} />
        )}
      </svg>
    </div>
  );
};

export const RingGauge: React.FC<{ value: number | null; size?: number; label?: string }> = ({ value, size = 112, label }) => {
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = value === null ? 0 : Math.max(0, Math.min(100, value));
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label || `${pct}%`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={GRID} strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke={INK} strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={`${(pct / 100) * c} ${c}`} transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" fontSize={size * 0.22} fontWeight={800} fill="#0f172a">
        {value === null ? '—' : `${Math.round(pct)}%`}
      </text>
    </svg>
  );
};

// Horizontal bars for labelled scores (topics, components). Value text uses ink, not the bar color.
export const HBarList: React.FC<{
  rows: { label: string; value: number | null; max?: number; suffix?: string; highlight?: boolean }[];
}> = ({ rows }) => (
  <div className="space-y-2">
    {rows.map(row => {
      const max = row.max ?? 100;
      const pct = row.value === null ? 0 : Math.max(0, Math.min(100, (row.value / max) * 100));
      return (
        <div key={row.label} className="grid grid-cols-[minmax(0,9rem)_1fr_3.5rem] items-center gap-2 text-xs" title={`${row.label}: ${row.value === null ? 'not measured' : `${row.value}${row.suffix || ''}`}`}>
          <span className={row.highlight ? 'font-bold text-slate-900 truncate' : 'text-slate-600 truncate'}>{row.label}</span>
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full rounded-full bg-indigo-600 transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-right tabular-nums font-semibold text-slate-700">
            {row.value === null ? '—' : `${Math.round(row.value)}${row.suffix || ''}`}
          </span>
        </div>
      );
    })}
  </div>
);
