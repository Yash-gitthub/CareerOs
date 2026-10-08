import React from 'react';
import { ArrowDown, ArrowUp, Check } from 'lucide-react';
import type { SkillCheck } from '../../engine/types';
import { Badge } from './ui';

const STATUS: Record<SkillCheck['status'], { label: string; tone: 'emerald' | 'sky' | 'amber'; icon: React.ReactNode }> = {
  verified: { label: 'Verified', tone: 'emerald', icon: <Check className="w-3 h-3" /> },
  above: { label: 'Higher than claimed', tone: 'sky', icon: <ArrowUp className="w-3 h-3" /> },
  below: { label: 'Below claimed', tone: 'amber', icon: <ArrowDown className="w-3 h-3" /> },
};

export const SkillVerificationTable: React.FC<{ checks: SkillCheck[] }> = ({ checks }) => (
  <div className="overflow-x-auto rounded-xl border border-slate-200">
    <table className="w-full text-xs">
      <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
        <tr>
          <th className="text-left font-semibold px-3 py-2">Skill</th>
          <th className="text-left font-semibold px-3 py-2">Claimed</th>
          <th className="text-left font-semibold px-3 py-2">Verified</th>
          <th className="text-left font-semibold px-3 py-2">Result</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {checks.map(c => {
          const s = STATUS[c.status];
          return (
            <tr key={c.skill}>
              <td className="px-3 py-2 font-semibold text-slate-800">
                {c.appliesTo.join(' / ')}
                <span className="block text-[10px] font-normal text-slate-500">
                  {c.correct !== null && c.total !== null ? `${c.correct}/${c.total} correct` : `${c.score}% on DSA section`}
                </span>
              </td>
              <td className="px-3 py-2 text-slate-600">{c.claimed}</td>
              <td className="px-3 py-2 font-bold text-slate-900">{c.verified}</td>
              <td className="px-3 py-2"><Badge tone={s.tone}>{s.icon}{s.label}</Badge></td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);
