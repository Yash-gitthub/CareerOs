import React from 'react';
import { clsx } from 'clsx';
import { AlertTriangle, TrendingDown, TrendingUp, Lightbulb, Check, X } from 'lucide-react';
import { useCareer } from '../../store/CareerStore';
import { explainDelta } from '../../engine/careerReadiness';
import { timeAgo } from '../../engine/dates';
import { Button } from '../common/Button';
import { Badge } from './ui';

export const useReadinessDelta = () => {
  const { state } = useCareer();
  const history = state.readinessHistory;
  const last = history[history.length - 1];
  // Compare against the most recent snapshot with a different score.
  const prev = [...history].reverse().find(s => last && Math.abs(s.score - last.score) >= 0.1);
  return {
    last,
    prev,
    reasons: last ? explainDelta(prev?.contributions, last.contributions) : [],
  };
};

export const ReadinessBreakdown: React.FC = () => {
  const { twin } = useCareer();
  const { last, prev, reasons } = useReadinessDelta();

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="text-3xl font-extrabold text-slate-900 tabular-nums">{Math.round(twin.readiness.score)}%</div>
          <p className="text-[11px] text-slate-500">Weighted from stored evidence · unmeasured parts count as 0</p>
        </div>
        {prev && last && (
          <div className="text-right text-xs">
            <div className="font-semibold text-slate-700 tabular-nums">{Math.round(prev.score)}% → {Math.round(last.score)}%</div>
            <div className="text-[11px] text-slate-500">since {timeAgo(prev.createdAt)}</div>
          </div>
        )}
      </div>

      {reasons.length > 0 && (
        <ul className="space-y-1 text-xs">
          {reasons.slice(0, 5).map(r => (
            <li key={r.key} className="flex items-center gap-1.5">
              {r.delta > 0 ? <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> : <TrendingDown className="w-3.5 h-3.5 text-red-500" />}
              <span className="tabular-nums font-semibold text-slate-900">{r.delta > 0 ? '+' : ''}{r.delta} pts</span>
              <span className="text-slate-600">{r.label}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-2">
        {twin.readiness.components.map(c => (
          <div key={c.key} className="text-xs" title={c.value === null ? c.hint : undefined}>
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-slate-700">{c.label} <span className="text-slate-400">· {c.weight}%</span></span>
              <span className="tabular-nums text-slate-600">
                {c.value === null
                  ? <span className="text-amber-700">Not measured</span>
                  : <><strong className="text-slate-900">{c.contribution}</strong> / {c.weight}</>}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full rounded-full bg-indigo-600 transition-all duration-500" style={{ width: `${c.value === null ? 0 : c.value}%` }} />
            </div>
            {c.value === null && <p className="text-[10px] text-slate-500 mt-0.5">{c.hint}</p>}
          </div>
        ))}
      </div>
    </div>
  );
};

export const SkillGapColumns: React.FC<{ limit?: number }> = ({ limit = 6 }) => {
  const { twin } = useCareer();
  const cols = [
    { key: 'critical', title: 'Critical gaps', tone: 'border-red-100 bg-red-50/50', head: 'text-red-800' },
    { key: 'developing', title: 'Developing', tone: 'border-amber-100 bg-amber-50/50', head: 'text-amber-800' },
    { key: 'strong', title: 'Strong', tone: 'border-emerald-100 bg-emerald-50/50', head: 'text-emerald-800' },
  ] as const;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
      {cols.map(col => {
        const items = twin.gaps.filter(g => g.bucket === col.key);
        return (
          <div key={col.key} className={clsx('p-3 rounded-xl border', col.tone)}>
            <p className={clsx('text-[11px] font-bold mb-2', col.head)}>{col.title} ({items.length})</p>
            {items.length ? (
              <ul className="space-y-1.5">
                {items.slice(0, limit).map(g => (
                  <li key={g.skill} className="text-[11px]" title={`Current ${Math.round(g.current)} · required ${g.required} · importance ${g.weight}`}>
                    <div className="flex justify-between gap-1">
                      <span className="font-semibold text-slate-800 truncate">{g.skill}</span>
                      <span className="tabular-nums text-slate-500 shrink-0">{Math.round(g.current)}/{g.required}</span>
                    </div>
                  </li>
                ))}
                {items.length > limit && <li className="text-[10px] text-slate-500">+{items.length - limit} more</li>}
              </ul>
            ) : (
              <p className="text-[11px] text-slate-500">None</p>
            )}
          </div>
        );
      })}
    </div>
  );
};

export const InterventionBanner: React.FC = () => {
  const { state, acceptIntervention, dismissIntervention } = useCareer();
  const open = state.interventions.filter(i => i.status === 'open');
  if (!open.length) return null;

  return (
    <div className="space-y-3">
      {open.slice(0, 3).map(i => (
        <div
          key={i.id}
          role="status"
          className={clsx(
            'p-4 rounded-2xl border flex flex-col md:flex-row md:items-center gap-4',
            i.severity === 'high' ? 'bg-red-50 border-red-200' : i.severity === 'medium' ? 'bg-amber-50 border-amber-200' : 'bg-indigo-50 border-indigo-200'
          )}
        >
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
              i.severity === 'high' ? 'bg-red-100 text-red-700' : i.severity === 'medium' ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-700')}>
              {i.severity === 'low' ? <Lightbulb className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            </div>
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-bold text-slate-900">{i.title}</p>
                <Badge tone={i.severity === 'high' ? 'red' : i.severity === 'medium' ? 'amber' : 'indigo'}>Personalized intervention</Badge>
              </div>
              <p className="text-xs text-slate-700">{i.message}</p>
              <p className="text-xs text-slate-900"><strong>Recommendation:</strong> {i.recommendation}</p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button size="sm" onClick={() => acceptIntervention(i.id)} leftIcon={<Check className="w-3.5 h-3.5" />}>Apply</Button>
            <Button size="sm" variant="ghost" onClick={() => dismissIntervention(i.id)} leftIcon={<X className="w-3.5 h-3.5" />}>Dismiss</Button>
          </div>
        </div>
      ))}
    </div>
  );
};
