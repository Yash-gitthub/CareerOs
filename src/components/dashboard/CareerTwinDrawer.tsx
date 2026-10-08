import React from 'react';
import { X, Compass, Sparkles } from 'lucide-react';
import { Button } from '../common/Button';
import { useCareer } from '../../store/CareerStore';
import { timeAgo } from '../../engine/dates';
import { HBarList } from '../charts/Charts';
import { Badge } from './ui';
import { GitHubCard, LeetCodeCard } from './integrations/IntegrationCards';
import { ReadinessBreakdown, SkillGapColumns } from './insights';

interface CareerTwinDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onStartAssessment: () => void;
}

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="space-y-2.5">
    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">{title}</h4>
    {children}
  </section>
);

const Row: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="flex items-center justify-between gap-3 text-xs py-1.5 border-b border-slate-100 last:border-0">
    <span className="text-slate-500">{label}</span>
    <span className="font-semibold text-slate-900 text-right">{value}</span>
  </div>
);

export const CareerTwinDrawer: React.FC<CareerTwinDrawerProps> = ({ isOpen, onClose, onStartAssessment }) => {
  const { twin, state } = useCareer();
  if (!isOpen) return null;

  const hasAssessment = state.assessments.length > 0;
  const b = twin.behavioral;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs" role="dialog" aria-modal="true" aria-label="Career Twin">
      <button className="absolute inset-0 w-full h-full cursor-default" aria-label="Close drawer" onClick={onClose} />
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-lg bg-white shadow-2xl border-l border-slate-200 flex flex-col">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center"><Compass className="w-4 h-4" /></div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Career Digital Twin</h3>
                <p className="text-[11px] text-slate-500">Version {state.twinVersion} · updated {timeAgo(state.twinUpdatedAt)}</p>
              </div>
            </div>
            <button onClick={onClose} aria-label="Close" className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-7">
            <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-900">Stage: {twin.stage}</span>
                {twin.calibrated ? <Badge tone="emerald">Calibrated</Badge> : <Badge tone="amber">Assessment pending</Badge>}
              </div>
              <p className="text-xs text-indigo-900/80 leading-relaxed">
                Targeting <strong>{twin.career.targetRole}</strong> ({twin.career.domain}) at <strong>{twin.career.dreamCompany}</strong>. Objective: {twin.career.objective} within {twin.career.timeline}.
              </p>
            </div>

            {!hasAssessment && (
              <div className="p-4 rounded-xl bg-slate-900 text-white space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-300"><Sparkles className="w-4 h-4" />Calibrate your Twin</div>
                <p className="text-xs text-slate-300 leading-relaxed">The diagnostic measures DSA, Core CS and domain skills so gaps and the roadmap are based on evidence, not just self-ratings.</p>
                <Button size="sm" onClick={() => { onClose(); onStartAssessment(); }} className="w-full bg-indigo-500 hover:bg-indigo-600">Start assessment</Button>
              </div>
            )}

            <Section title="Career readiness">
              <ReadinessBreakdown />
            </Section>

            <Section title="Skill gaps vs. role requirements">
              <SkillGapColumns />
            </Section>

            <Section title="Technical profile">
              <HBarList rows={twin.technical.categories.filter(c => c.count > 0).map(c => ({ label: `${c.label} (${c.count})`, value: c.score }))} />
              {twin.technical.categories.every(c => c.count === 0) && <p className="text-xs text-slate-500">No skills listed in your profile yet.</p>}
            </Section>

            <Section title="Coding profile">
              <div>
                <Row label="Problems solved (LeetCode)" value={twin.coding.problemsSolved ?? 'Not connected'} />
                {twin.coding.problemsSolved !== null && <Row label="Easy / Medium / Hard" value={`${twin.coding.easy} / ${twin.coding.medium} / ${twin.coding.hard}`} />}
                <Row label="DSA score" value={twin.coding.dsaScore === null ? 'Not measured' : `${Math.round(twin.coding.dsaScore)}/100`} />
                <Row label="Weak areas" value={twin.coding.weakAreas.map(w => w.label).join(', ') || '—'} />
                <Row label="Coding days (7d / 28d)" value={`${twin.coding.activeDays7} / ${twin.coding.activeDays28}`} />
                <Row label="Current streak" value={`${twin.coding.streak} day${twin.coding.streak === 1 ? '' : 's'}`} />
              </div>
            </Section>

            <Section title="Project profile">
              <div>
                <Row label="Projects (active / deployed)" value={`${twin.project.count} (${twin.project.active} / ${twin.project.deployed})`} />
                <Row label="Role-relevant projects" value={twin.project.relevantCount} />
                <Row label="Average progress" value={twin.project.avgProgress === null ? '—' : `${twin.project.avgProgress}%`} />
                <Row label="Technologies" value={twin.project.technologies.slice(0, 6).join(', ') || '—'} />
                <Row label="GitHub repos / stars" value={twin.project.githubRepos === null ? 'Not connected' : `${twin.project.githubRepos} / ${twin.project.githubStars}`} />
              </div>
            </Section>

            <Section title="Learning profile">
              <div>
                <Row label="Learning hours (7d / total)" value={`${twin.learning.hours7} / ${twin.learning.hoursTotal}`} />
                <Row label="Roadmap topics completed" value={twin.learning.totalTopics ? `${twin.learning.completedTopics} / ${twin.learning.totalTopics}` : '—'} />
                <Row label="Current stage" value={twin.learning.currentStage} />
                <Row label="Preferred resources" value={twin.learning.preferredResources.slice(0, 3).join(', ') || '—'} />
              </div>
            </Section>

            <Section title="Behavioral profile">
              <div>
                <Row label="Tasks completed / missed / skipped" value={`${b.completed} / ${b.missed} / ${b.skipped}`} />
                <Row label="Consistency (7d / 28d)" value={`${b.consistency7.score === null ? '—' : `${Math.round(b.consistency7.score)}%`} / ${b.consistency28.score === null ? '—' : `${Math.round(b.consistency28.score)}%`}`} />
                <Row label="Most productive period" value={b.productivePeriod || '—'} />
                <Row label="Tasks per active day" value={b.avgTasksPerActiveDay ?? '—'} />
                <Row label="Needs intervention" value={b.interventionAreas.join('; ') || 'Nothing right now'} />
              </div>
            </Section>

            <Section title="Integrations">
              <div className="space-y-3">
                <GitHubCard />
                <LeetCodeCard />
              </div>
            </Section>
          </div>
        </div>
      </div>
    </div>
  );
};
