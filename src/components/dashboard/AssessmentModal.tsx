import React, { useEffect, useMemo, useState } from 'react';
import { X, CheckCircle2, Brain, ArrowRight, ArrowLeft, Loader2, ShieldCheck, Lock } from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from '../common/Button';
import { useOnboarding } from '../../context/OnboardingContext';
import { useCareer } from '../../store/CareerStore';
import { recordAssessmentResult } from '../../lib/supabase';
import { COMMUNICATION_ITEMS, buildAssessment } from '../../data/assessmentBank';
import type { AssessmentAnswer, AssessmentResult, AssessmentSection, DashboardTab } from '../../engine/types';
import { DOMAIN_LABEL, DSA_TOPICS, CORE_CS_TOPICS, roleDomain } from '../../engine/roleRequirements';
import { applyVerification, planVerification, scoreVerification, unverifiableSkills } from '../../engine/skillVerification';
import { isUnlocked } from '../../engine/unlocks';
import { uid } from '../../engine/dates';
import { HBarList } from '../charts/Charts';
import { SkillVerificationTable } from './SkillVerificationTable';

const SECTION_LABEL: Record<AssessmentSection, string> = {
  programming: 'Programming',
  dsa: 'Data Structures & Algorithms',
  core_cs: 'Core CS',
  domain: 'Domain',
};

const LIKERT = ['Strongly disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly agree'];

type Phase = 'intro' | 'questions' | 'communication' | 'saving' | 'results';

interface Draft {
  answers: Record<string, number>; // question id → index into the question's original options
  likert: number[];
  index: number;
}

interface Item {
  id: string;
  label: string;
  question: string;
  options: string[];
  correct: number;
}

const draftKey = (userId: string) => `careeros_assessment_draft_${userId}`;

// Deterministic per attempt, so a resumed test shows the same order and option positions
// carry no hint (most bank answers would otherwise sit in the same slot).
const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
};
const shuffledOrder = (n: number, seed: string): number[] => {
  const order = Array.from({ length: n }, (_, i) => i);
  let x = hash(seed) || 1;
  for (let i = n - 1; i > 0; i--) {
    x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
    const j = (x >>> 0) % (i + 1);
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
};

interface AssessmentFlowProps {
  // 'gate': mandatory first test shown in place of the dashboard; it cannot be closed.
  variant: 'modal' | 'gate';
  onClose: () => void;
  onNavigate?: (tab: DashboardTab) => void;
}

export const AssessmentFlow: React.FC<AssessmentFlowProps> = ({ variant, onClose, onNavigate }) => {
  const { user } = useOnboarding();
  const { submitAssessment, state, twin, setActiveTab } = useCareer();
  const isGate = variant === 'gate';
  const domain = roleDomain(user.career.targetRole);
  const attempt = state.assessments.length;

  const coreQuestions = useMemo(() => buildAssessment(domain), [domain]);
  const plan = useMemo(() => planVerification(user), [user]);

  const items: Item[] = useMemo(() => [
    ...coreQuestions.map(q => ({
      id: q.id,
      label: `${SECTION_LABEL[q.section]}${q.section === 'domain' ? ` · ${DOMAIN_LABEL[domain]}` : ''}`,
      question: q.question,
      options: q.options,
      correct: q.correct,
    })),
    ...plan.flatMap(p => p.questions.map(q => ({
      id: q.id,
      label: `Skill verification · ${p.appliesTo.join(' / ')} (you said ${p.claimed})`,
      question: q.question,
      options: q.options,
      correct: q.correct,
    }))),
  ], [coreQuestions, plan, domain]);

  const [phase, setPhase] = useState<Phase>('intro');
  const [draft, setDraft] = useState<Draft>({ answers: {}, likert: COMMUNICATION_ITEMS.map(() => -1), index: 0 });
  const [result, setResult] = useState<AssessmentResult | null>(null);

  // Restore an unfinished attempt.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(draftKey(user.id));
      if (saved) {
        const parsed = JSON.parse(saved) as Draft;
        setDraft({ ...parsed, index: Math.min(parsed.index, items.length - 1) });
      }
    } catch {
      // ignore
    }
    setPhase('intro');
    setResult(null);
    // Only on open / user change; `items` is stable for a given profile.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  useEffect(() => {
    if (phase === 'results') return;
    try {
      localStorage.setItem(draftKey(user.id), JSON.stringify(draft));
    } catch {
      // ignore
    }
  }, [draft, phase, user.id]);

  const total = items.length;
  const answeredCount = items.filter(i => draft.answers[i.id] !== undefined).length;
  const q = items[draft.index];
  const optionOrder = q ? shuffledOrder(q.options.length, `${user.id}:${attempt}:${q.id}`) : [];
  const previousAttempt = state.assessments[state.assessments.length - 1];

  const finish = () => {
    setPhase('saving');
    const answers: AssessmentAnswer[] = coreQuestions.map(question => {
      const choice = draft.answers[question.id] ?? -1;
      return { questionId: question.id, section: question.section, topic: question.topic, choice, correct: choice === question.correct };
    });
    const pct = (list: AssessmentAnswer[]) => (list.length ? Math.round((list.filter(a => a.correct).length / list.length) * 100) : 0);
    const sectionScores = {
      programming: pct(answers.filter(a => a.section === 'programming')),
      dsa: pct(answers.filter(a => a.section === 'dsa')),
      core_cs: pct(answers.filter(a => a.section === 'core_cs')),
      domain: pct(answers.filter(a => a.section === 'domain')),
    };
    const topicScores: Record<string, number> = {};
    [...DSA_TOPICS.map(t => t.key), ...CORE_CS_TOPICS.map(t => t.key)].forEach(key => {
      const list = answers.filter(a => a.topic === key);
      if (list.length) topicScores[key] = pct(list);
    });
    const rated = draft.likert.filter(v => v >= 0);
    const communication = rated.length ? Math.round((rated.reduce((s, v) => s + v, 0) / (rated.length * 4)) * 100) : 0;
    const completedAt = new Date().toISOString();
    const skillChecks = scoreVerification(plan, draft.answers, user, sectionScores.dsa);

    const res: AssessmentResult = {
      id: uid('asmt'),
      completedAt,
      targetRole: user.career.targetRole,
      domain,
      answers,
      sectionScores,
      topicScores,
      communication,
      skillChecks,
    };
    submitAssessment(res, applyVerification(user.skills, skillChecks, completedAt));
    recordAssessmentResult({ userId: user.id, targetRole: user.career.targetRole, score: answers.filter(a => a.correct).length, totalQuestions: answers.length });
    try {
      localStorage.removeItem(draftKey(user.id));
    } catch {
      // ignore
    }
    setResult(res);
    setPhase('results');
  };

  const go = (tab: DashboardTab) => {
    setActiveTab(tab);
    if (onNavigate) onNavigate(tab);
    onClose();
  };

  const untested = result ? unverifiableSkills(user, result.skillChecks || []) : [];

  return (
    <div className={clsx(
      'bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 relative space-y-6',
      isGate ? 'shadow-card' : 'shadow-xl max-w-xl w-full max-h-[92vh] overflow-y-auto'
    )}>
      {!isGate && (
        <button onClick={onClose} aria-label="Close" className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
          <X className="w-5 h-5" />
        </button>
      )}

      <div className="space-y-1.5 pr-8">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">
          {isGate ? <ShieldCheck className="w-3.5 h-3.5" /> : <Brain className="w-3.5 h-3.5" />}
          <span>{isGate ? 'Required · Skill Verification Test' : 'Baseline Skill Diagnostic'}</span>
        </div>
        <h3 className="text-xl font-bold text-slate-900">
          {phase === 'results' ? 'Your verified skill profile' : `Calibrating for ${user.career.targetRole}`}
        </h3>
      </div>

      {phase === 'intro' && (
        <div className="space-y-4">
          {isGate && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex gap-2">
              <Lock className="w-4 h-4 shrink-0 mt-0.5" />
              <span>CareerOS features stay locked until you finish this test. It checks whether the skill levels you entered in your profile are accurate, so your roadmap starts from where you really are.</span>
            </div>
          )}
          <p className="text-sm text-slate-600 leading-relaxed">
            {total} multiple-choice questions across Programming, DSA (10 topics), Core CS and {DOMAIN_LABEL[domain]}
            {plan.length ? <>, plus 3 questions of rising difficulty for each of {plan.length} skills you declared</> : null}
            , then a short communication self-assessment. About {Math.max(10, Math.round(total * 0.4))} minutes.
          </p>
          {plan.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {plan.map(p => (
                <span key={p.key} className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                  {p.appliesTo.join(' / ')} · claimed {p.claimed}
                </span>
              ))}
            </div>
          )}
          <ul className="text-xs text-slate-600 space-y-1 list-disc pl-5">
            <li>Each declared skill gets a basic, an intermediate and an advanced question. How many you get right sets your verified level.</li>
            <li>Your verified level replaces your self-rating in your Career Twin, skill gaps and readiness score.</li>
            <li>Answer honestly. Guessing only makes your plan less accurate. Your progress is saved if you leave.</li>
          </ul>
          {previousAttempt && (
            <p className="text-[11px] text-slate-500">Last attempt: {new Date(previousAttempt.completedAt).toLocaleDateString()}. Retaking updates your Twin with the newest results.</p>
          )}
          <Button onClick={() => setPhase('questions')} rightIcon={<ArrowRight className="w-4 h-4" />} className="w-full">
            {answeredCount ? `Resume (${answeredCount}/${total} answered)` : 'Start test'}
          </Button>
        </div>
      )}

      {phase === 'questions' && q && (
        <div className="space-y-4">
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
              <span className="shrink-0">Question {draft.index + 1} of {total}</span>
              <span className="text-right truncate">{q.label}</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full bg-indigo-600 transition-all" style={{ width: `${((draft.index + 1) / total) * 100}%` }} />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <p className="text-sm font-semibold text-slate-800">{q.question}</p>
            <div className="space-y-2" role="radiogroup">
              {optionOrder.map(i => {
                const selected = draft.answers[q.id] === i;
                return (
                  <button
                    key={i}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setDraft(d => ({ ...d, answers: { ...d.answers, [q.id]: i } }))}
                    className={clsx(
                      'w-full text-left p-3 rounded-lg border text-xs font-medium transition-colors',
                      selected ? 'border-indigo-500 bg-indigo-50 text-indigo-900' : 'border-slate-200 bg-white hover:border-indigo-400 text-slate-700'
                    )}
                  >
                    {q.options[i]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <Button variant="ghost" size="sm" disabled={draft.index === 0} onClick={() => setDraft(d => ({ ...d, index: d.index - 1 }))} leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>Back</Button>
            <div className="flex items-center gap-2">
              {!isGate && <button onClick={onClose} className="text-xs text-slate-500 hover:text-slate-700 underline">Resume later</button>}
              <Button
                size="sm"
                disabled={draft.answers[q.id] === undefined}
                onClick={() => (draft.index < total - 1 ? setDraft(d => ({ ...d, index: d.index + 1 })) : setPhase('communication'))}
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                {draft.index < total - 1 ? 'Next' : 'Continue'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {phase === 'communication' && (
        <div className="space-y-4">
          <p className="text-xs text-slate-600">Communication self-assessment: how much do you agree?</p>
          {COMMUNICATION_ITEMS.map((item, idx) => (
            <div key={idx} className="space-y-2">
              <p className="text-xs font-semibold text-slate-800">{item}</p>
              <div className="grid grid-cols-5 gap-1" role="radiogroup" aria-label={item}>
                {LIKERT.map((label, v) => (
                  <button
                    key={v}
                    type="button"
                    role="radio"
                    aria-checked={draft.likert[idx] === v}
                    title={label}
                    onClick={() => setDraft(d => ({ ...d, likert: d.likert.map((x, j) => (j === idx ? v : x)) }))}
                    className={clsx(
                      'py-1.5 rounded-md border text-[10px] font-semibold transition-colors',
                      draft.likert[idx] === v ? 'border-indigo-500 bg-indigo-600 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-400'
                    )}
                  >
                    {v + 1}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <p className="text-[10px] text-slate-400">1 = Strongly disagree · 5 = Strongly agree</p>
          <div className="flex justify-between">
            <Button variant="ghost" size="sm" onClick={() => setPhase('questions')} leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>Back</Button>
            <Button size="sm" disabled={draft.likert.some(v => v < 0)} onClick={finish}>Submit test</Button>
          </div>
        </div>
      )}

      {phase === 'saving' && (
        <div className="py-10 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-800">Verifying your skills…</p>
          <p className="text-xs text-slate-500">Comparing your answers with the levels you claimed and generating your roadmap.</p>
        </div>
      )}

      {phase === 'results' && result && (
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center"><CheckCircle2 className="w-5 h-5" /></div>
            <div>
              <h4 className="text-base font-bold text-slate-900">Test completed</h4>
              <p className="text-xs text-slate-500">Your verified levels now drive your Career Twin, skill gaps and readiness.</p>
            </div>
          </div>

          {(result.skillChecks?.length || 0) > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-800">Claimed vs. verified level</p>
              <SkillVerificationTable checks={result.skillChecks || []} />
            </div>
          )}
          {untested.length > 0 && (
            <p className="text-[11px] text-slate-500">
              Not covered by this test: <strong>{untested.join(', ')}</strong>. These stay at your self-rating until projects, GitHub or certifications back them up.
            </p>
          )}

          <HBarList rows={[
            { label: 'Programming', value: result.sectionScores.programming, suffix: '%' },
            { label: 'DSA', value: result.sectionScores.dsa, suffix: '%' },
            { label: 'Core CS', value: result.sectionScores.core_cs, suffix: '%' },
            { label: DOMAIN_LABEL[domain], value: result.sectionScores.domain, suffix: '%' },
            { label: 'Communication', value: result.communication, suffix: '%' },
          ]} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-red-50/60 border border-red-100">
              <p className="font-bold text-red-800 mb-1">Critical gaps</p>
              <p className="text-red-900/80">{twin.gaps.filter(g => g.bucket === 'critical').slice(0, 5).map(g => g.skill).join(', ') || 'None'}</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
              <p className="font-bold text-emerald-800 mb-1">Strong</p>
              <p className="text-emerald-900/80">{twin.gaps.filter(g => g.bucket === 'strong').map(g => g.skill).join(', ') || 'Build evidence with projects & practice'}</p>
            </div>
          </div>

          {isGate ? (
            <div className="space-y-2">
              <p className="text-[11px] text-slate-500">You've unlocked <strong>Overview</strong> and <strong>Roadmap</strong>. The rest of CareerOS opens one feature at a time as you make progress.</p>
              <Button className="w-full" onClick={() => go('roadmap')} rightIcon={<ArrowRight className="w-4 h-4" />}>Start exploring: open my Roadmap</Button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-2">
              <Button className="flex-1" onClick={() => go('roadmap')}>View my roadmap</Button>
              {isUnlocked(state, 'tasks') && <Button className="flex-1" variant="outline" onClick={() => go('tasks')}>See today's tasks</Button>}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface AssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Retake from the dashboard (roadmap, Career Twin drawer).
export const AssessmentModal: React.FC<AssessmentModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs" role="dialog" aria-modal="true" aria-label="Career assessment">
      <AssessmentFlow variant="modal" onClose={onClose} />
    </div>
  );
};
