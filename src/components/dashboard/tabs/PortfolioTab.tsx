import React, { useMemo, useState } from 'react';
import { clsx } from 'clsx';
import { Award, Briefcase, GraduationCap, BadgeCheck, Link2, Plus, Trash2, ExternalLink, ShieldCheck, AlertTriangle, Info, Code2, Pencil } from 'lucide-react';
import type { PortfolioItem, PortfolioKind } from '../../../engine/types';
import { useCareer } from '../../../store/CareerStore';
import { useOnboarding } from '../../../context/OnboardingContext';
import { analyzePortfolio } from '../../../engine/portfolioAnalyzer';
import { portfolioChecks } from '../../../engine/careerReadiness';
import { Button } from '../../common/Button';
import { RingGauge } from '../../charts/Charts';
import { Badge, Card, CardHeader, EmptyState, Field, TextButton, inputClass } from '../ui';
import { GitHubCard } from '../integrations/IntegrationCards';

const SECTIONS: { kind: PortfolioKind; title: string; icon: React.ReactNode; titleLabel: string; orgLabel: string; empty: string }[] = [
  { kind: 'experience', title: 'Experience', icon: <Briefcase className="w-4 h-4" />, titleLabel: 'Role', orgLabel: 'Organization', empty: 'Internships, part-time work, research or volunteer roles.' },
  { kind: 'achievement', title: 'Achievements', icon: <Award className="w-4 h-4" />, titleLabel: 'Achievement', orgLabel: 'Event / issuer', empty: 'Hackathons, competitions, scholarships, publications.' },
  { kind: 'certification', title: 'Certifications', icon: <BadgeCheck className="w-4 h-4" />, titleLabel: 'Certification', orgLabel: 'Issuer', empty: 'Verifiable certificates — add the credential link.' },
  { kind: 'education', title: 'Additional education', icon: <GraduationCap className="w-4 h-4" />, titleLabel: 'Program / course', orgLabel: 'Institution', empty: 'Diplomas, exchange programs or long courses beyond your degree.' },
  { kind: 'link', title: 'Links (LinkedIn, website)', icon: <Link2 className="w-4 h-4" />, titleLabel: 'Label', orgLabel: 'Platform', empty: 'Add your LinkedIn profile and personal site.' },
];

type Form = Omit<PortfolioItem, 'id' | 'kind'>;
const emptyForm: Form = { title: '', organization: '', detail: '', date: '', url: '' };

const ItemForm: React.FC<{ kind: PortfolioKind; initial: Form; onSave: (f: Form) => void; onCancel: () => void; titleLabel: string; orgLabel: string }> = ({ kind, initial, onSave, onCancel, titleLabel, orgLabel }) => {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState('');
  return (
    <form
      className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200"
      onSubmit={e => {
        e.preventDefault();
        if (!form.title.trim()) return setError(`${titleLabel} is required.`);
        if (form.url && !/^https?:\/\/\S+$/i.test(form.url.trim())) return setError('Link must start with http:// or https://');
        if (kind === 'link' && !form.url.trim()) return setError('Add the URL.');
        onSave({ ...form, title: form.title.trim(), organization: form.organization.trim(), detail: form.detail.trim(), url: form.url.trim() });
      }}
    >
      <Field label={titleLabel}><input className={inputClass} value={form.title} onChange={e => { setForm({ ...form, title: e.target.value }); setError(''); }} /></Field>
      <Field label={orgLabel}><input className={inputClass} value={form.organization} onChange={e => setForm({ ...form, organization: e.target.value })} /></Field>
      {kind !== 'link' && (
        <Field label="Details" className="sm:col-span-2"><textarea rows={2} className={inputClass} value={form.detail} onChange={e => setForm({ ...form, detail: e.target.value })} /></Field>
      )}
      {kind !== 'link' && <Field label="Date"><input type="month" className={inputClass} value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></Field>}
      <Field label={kind === 'link' ? 'URL' : 'Link (optional)'} className={kind === 'link' ? 'sm:col-span-2' : ''}>
        <input className={inputClass} value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} placeholder="https://" />
      </Field>
      {error && <p className="sm:col-span-2 text-xs text-red-600">{error}</p>}
      <div className="sm:col-span-2 flex gap-2">
        <Button type="submit" size="sm">Save</Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
};

const PortfolioSection: React.FC<typeof SECTIONS[number]> = ({ kind, title, icon, titleLabel, orgLabel, empty }) => {
  const { state, addPortfolioItem, updatePortfolioItem, removePortfolioItem } = useCareer();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const items = state.portfolio.filter(p => p.kind === kind);

  return (
    <Card>
      <CardHeader icon={icon} title={title} action={<TextButton onClick={() => setAdding(a => !a)}><Plus className="w-3 h-3" />Add</TextButton>} />
      <div className="space-y-2">
        {adding && (
          <ItemForm kind={kind} titleLabel={titleLabel} orgLabel={orgLabel} initial={emptyForm} onCancel={() => setAdding(false)} onSave={f => { addPortfolioItem({ ...f, kind }); setAdding(false); }} />
        )}
        {items.map(item => editing === item.id ? (
          <ItemForm key={item.id} kind={kind} titleLabel={titleLabel} orgLabel={orgLabel} initial={item} onCancel={() => setEditing(null)} onSave={f => { updatePortfolioItem(item.id, f); setEditing(null); }} />
        ) : (
          <div key={item.id} className="p-3 rounded-lg border border-slate-200 flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-0.5">
              <p className="text-xs font-semibold text-slate-900">{item.title}{item.organization && <span className="font-normal text-slate-500"> · {item.organization}</span>}</p>
              {item.detail && <p className="text-[11px] text-slate-600">{item.detail}</p>}
              <div className="flex gap-3 text-[10px] text-slate-500">
                {item.date && <span>{item.date}</span>}
                {item.url && <a href={item.url} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline inline-flex items-center gap-0.5 break-all">{item.url}<ExternalLink className="w-3 h-3 shrink-0" /></a>}
              </div>
            </div>
            <div className="flex shrink-0">
              <TextButton tone="slate" aria-label="Edit" onClick={() => setEditing(item.id)}><Pencil className="w-3 h-3" /></TextButton>
              <TextButton tone="red" aria-label="Remove" onClick={() => removePortfolioItem(item.id)}><Trash2 className="w-3 h-3" /></TextButton>
            </div>
          </div>
        ))}
        {!items.length && !adding && <p className="text-[11px] text-slate-500">{empty}</p>}
      </div>
    </Card>
  );
};

export const PortfolioTab: React.FC = () => {
  const { state, twin, setActiveTab } = useCareer();
  const { user, goToStep } = useOnboarding();
  const analysis = useMemo(() => analyzePortfolio(user, state, twin), [user, state, twin]);
  const checks = portfolioChecks(user, state);
  const allSkills = Object.values(user.skills).flat();

  const findingIcon = (s: string) =>
    s === 'strength' ? <ShieldCheck className="w-4 h-4 text-emerald-600" /> : s === 'warning' ? <AlertTriangle className="w-4 h-4 text-amber-600" /> : <Info className="w-4 h-4 text-indigo-600" />;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader icon={<GraduationCap className="w-4 h-4" />} title="Education" subtitle="From your profile" action={<TextButton onClick={() => goToStep(2)}>Edit in profile</TextButton>} />
          <p className="text-xs text-slate-800 font-semibold">{user.education.degree} — {user.education.branch}</p>
          <p className="text-xs text-slate-600">{user.education.college || 'College not set'} · {user.education.year} · Graduating {user.education.graduationYear}{user.education.cgpa ? ` · CGPA ${user.education.cgpa}` : ''}</p>
        </Card>

        <Card>
          <CardHeader icon={<Code2 className="w-4 h-4" />} title="Skills" subtitle="From your profile — scores come from your Career Twin" action={<TextButton onClick={() => goToStep(3)}>Edit skills</TextButton>} />
          {allSkills.length ? (
            <div className="flex flex-wrap gap-1.5">
              {allSkills.map(s => {
                const score = twin.skills.find(x => x.skill === s.name)?.score;
                return <Badge key={s.name} tone="indigo">{s.name}{score !== undefined && <span className="font-normal opacity-80">· {Math.round(score)}</span>}</Badge>;
              })}
            </div>
          ) : <EmptyState title="No skills listed yet." />}
        </Card>

        <Card>
          <CardHeader icon={<Briefcase className="w-4 h-4" />} title="Projects" subtitle={`${state.projects.length} tracked`} action={<TextButton onClick={() => setActiveTab('projects')}>Manage projects</TextButton>} />
          {state.projects.length ? (
            <ul className="space-y-1.5">
              {state.projects.map(p => (
                <li key={p.id} className="text-xs flex justify-between gap-2">
                  <span className="font-semibold text-slate-800 truncate">{p.title}</span>
                  <span className="text-slate-500 shrink-0">{p.techStack.slice(0, 3).join(', ')}</span>
                </li>
              ))}
            </ul>
          ) : <EmptyState title="No projects yet." />}
        </Card>

        {SECTIONS.map(s => <PortfolioSection key={s.kind} {...s} />)}

        <GitHubCard />
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader icon={<ShieldCheck className="w-4 h-4" />} title="Portfolio analyzer" subtitle="Based only on what you've added" />
          <div className="flex items-center gap-4 mb-4">
            <RingGauge value={analysis.score} size={88} label={`Portfolio completeness ${analysis.score}%`} />
            <p className="text-xs text-slate-600">Completeness score. It feeds 10% of your Career Readiness.</p>
          </div>
          <ul className="space-y-1.5 mb-4">
            {checks.map(c => (
              <li key={c.key} className={clsx('text-[11px] flex items-center gap-1.5', c.passed ? 'text-slate-500' : 'text-slate-800 font-semibold')}>
                <span className={clsx('w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] text-white', c.passed ? 'bg-emerald-500' : 'bg-slate-300')}>{c.passed ? '✓' : ''}</span>
                {c.label}
              </li>
            ))}
          </ul>
          <div className="space-y-2">
            {analysis.findings.length ? analysis.findings.map((f, i) => (
              <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200/70">
                {findingIcon(f.severity)}
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-900">{f.title}</p>
                  <p className="text-[11px] text-slate-600">{f.detail}</p>
                </div>
              </div>
            )) : <p className="text-xs text-slate-500">Add projects and portfolio items to get feedback.</p>}
          </div>
        </Card>
      </div>
    </div>
  );
};
