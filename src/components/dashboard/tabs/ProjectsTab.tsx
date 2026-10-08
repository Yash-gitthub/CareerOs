import React, { useMemo, useState } from 'react';
import { clsx } from 'clsx';
import { FolderGit2, Plus, Trash2, ExternalLink, Sparkles, Lightbulb, ListPlus, Check, Pencil } from 'lucide-react';
import type { Project, ProjectBlueprint, ProjectStage } from '../../../engine/types';
import { useCareer } from '../../../store/CareerStore';
import { useOnboarding } from '../../../context/OnboardingContext';
import { projectProgress } from '../../../engine/careerReadiness';
import { analyzePortfolio } from '../../../engine/portfolioAnalyzer';
import { recommendProjects } from '../../../engine/projectRecommendation';
import { formatDate, today as todayISO } from '../../../engine/dates';
import { Button } from '../../common/Button';
import { Badge, Card, CardHeader, EmptyState, Field, Meter, TextButton, inputClass } from '../ui';

const STAGES: ProjectStage[] = ['idea', 'planning', 'development', 'testing', 'deployment', 'completed'];
const STAGE_LABEL: Record<ProjectStage, string> = {
  idea: 'Idea', planning: 'Planning', development: 'Development', testing: 'Testing', deployment: 'Deployment', completed: 'Completed',
};

type ProjectForm = Pick<Project, 'title' | 'description' | 'repoUrl' | 'deployUrl' | 'startDate' | 'deadline'> & { stack: string };

const emptyForm = (): ProjectForm => ({ title: '', description: '', repoUrl: '', deployUrl: '', startDate: todayISO(), deadline: '', stack: '' });

const isUrl = (v: string) => !v || /^https?:\/\/\S+$/i.test(v.trim());

const ProjectEditor: React.FC<{ initial: ProjectForm; onSave: (f: ProjectForm) => void; onCancel: () => void; submitLabel: string }> = ({ initial, onSave, onCancel, submitLabel }) => {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState('');
  return (
    <form
      className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200"
      onSubmit={e => {
        e.preventDefault();
        if (!form.title.trim()) return setError('Project title is required.');
        if (!isUrl(form.repoUrl) || !isUrl(form.deployUrl)) return setError('Links must start with http:// or https://');
        if (form.deadline && form.startDate && form.deadline < form.startDate) return setError('Deadline must be after the start date.');
        onSave(form);
      }}
    >
      <Field label="Title" className="sm:col-span-2"><input className={inputClass} value={form.title} onChange={e => { setForm({ ...form, title: e.target.value }); setError(''); }} /></Field>
      <Field label="Description — problem, your role, outcome" className="sm:col-span-2">
        <textarea className={inputClass} rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
      </Field>
      <Field label="Technologies (comma-separated)" className="sm:col-span-2"><input className={inputClass} value={form.stack} onChange={e => setForm({ ...form, stack: e.target.value })} placeholder="React, Node.js, PostgreSQL" /></Field>
      <Field label="GitHub repository URL"><input className={inputClass} value={form.repoUrl} onChange={e => setForm({ ...form, repoUrl: e.target.value })} placeholder="https://github.com/…" /></Field>
      <Field label="Deployment URL"><input className={inputClass} value={form.deployUrl} onChange={e => setForm({ ...form, deployUrl: e.target.value })} placeholder="https://…" /></Field>
      <Field label="Start date"><input type="date" className={inputClass} value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} /></Field>
      <Field label="Deadline"><input type="date" className={inputClass} value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} /></Field>
      {error && <p className="sm:col-span-2 text-xs text-red-600">{error}</p>}
      <div className="sm:col-span-2 flex gap-2">
        <Button type="submit" size="sm">{submitLabel}</Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
};

const parseStack = (s: string) => Array.from(new Set(s.split(',').map(x => x.trim()).filter(Boolean)));

const ProjectCard: React.FC<{ project: Project }> = ({ project }) => {
  const { setProjectStage, updateProject, deleteProject, addProjectMilestone, toggleProjectMilestone, removeProjectMilestone, createTaskFromMilestone } = useCareer();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [msTitle, setMsTitle] = useState('');
  const [msDue, setMsDue] = useState('');
  const [showBlueprint, setShowBlueprint] = useState(false);
  const progress = projectProgress(project);
  const stageIndex = STAGES.indexOf(project.stage);
  const overdue = project.deadline && project.deadline < todayISO() && project.stage !== 'completed';

  return (
    <Card>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-bold text-slate-900">{project.title}</h3>
            {project.isRecommended && <Badge tone="indigo"><Sparkles className="w-3 h-3" />Recommended</Badge>}
            {overdue && <Badge tone="red">Past deadline</Badge>}
          </div>
          {project.description && <p className="text-xs text-slate-600 leading-relaxed">{project.description}</p>}
          <div className="flex flex-wrap gap-1.5 pt-1">{project.techStack.map(t => <Badge key={t}>{t}</Badge>)}</div>
          <div className="flex flex-wrap gap-3 text-[11px] text-slate-500 pt-1">
            {project.repoUrl && <a href={project.repoUrl} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline inline-flex items-center gap-0.5">Repository<ExternalLink className="w-3 h-3" /></a>}
            {project.deployUrl && <a href={project.deployUrl} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline inline-flex items-center gap-0.5">Live demo<ExternalLink className="w-3 h-3" /></a>}
            {project.startDate && <span>Started {formatDate(project.startDate)}</span>}
            {project.deadline && <span>Deadline {formatDate(project.deadline)}</span>}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <TextButton tone="slate" onClick={() => setEditing(e => !e)}><Pencil className="w-3 h-3" />Edit</TextButton>
          {confirmDelete ? (
            <>
              <TextButton tone="red" onClick={() => deleteProject(project.id)}>Confirm delete</TextButton>
              <TextButton tone="slate" onClick={() => setConfirmDelete(false)}>Cancel</TextButton>
            </>
          ) : (
            <TextButton tone="red" onClick={() => setConfirmDelete(true)}><Trash2 className="w-3 h-3" />Delete</TextButton>
          )}
        </div>
      </div>

      {editing && (
        <div className="mb-4">
          <ProjectEditor
            submitLabel="Save project"
            initial={{ title: project.title, description: project.description, repoUrl: project.repoUrl, deployUrl: project.deployUrl, startDate: project.startDate, deadline: project.deadline, stack: project.techStack.join(', ') }}
            onCancel={() => setEditing(false)}
            onSave={f => {
              updateProject(project.id, { title: f.title.trim(), description: f.description.trim(), repoUrl: f.repoUrl.trim(), deployUrl: f.deployUrl.trim(), startDate: f.startDate, deadline: f.deadline, techStack: parseStack(f.stack) });
              setEditing(false);
            }}
          />
        </div>
      )}

      {/* Stage pipeline */}
      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1"><span className="text-slate-600">Progress</span><span className="tabular-nums font-semibold text-slate-900">{progress}%</span></div>
        <Meter value={progress} tone={project.stage === 'completed' ? 'emerald' : 'indigo'} label={`${project.title} progress`} />
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 mb-4" role="group" aria-label="Project stage">
        {STAGES.map((s, i) => (
          <button
            key={s}
            type="button"
            onClick={() => setProjectStage(project.id, s)}
            aria-pressed={project.stage === s}
            className={clsx(
              'py-1.5 rounded-lg text-[10px] font-bold border transition-colors',
              i < stageIndex ? 'bg-indigo-50 border-indigo-100 text-indigo-700'
                : i === stageIndex ? 'bg-indigo-600 border-indigo-600 text-white'
                : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-300'
            )}
          >
            {STAGE_LABEL[s]}
          </button>
        ))}
      </div>

      {/* Milestones */}
      <div className="space-y-2">
        <p className="text-xs font-bold text-slate-700">Milestones ({project.milestones.filter(m => m.completedAt).length}/{project.milestones.length})</p>
        {project.milestones.map(m => (
          <div key={m.id} className="flex items-center justify-between gap-2 p-2 rounded-lg border border-slate-200">
            <label className="flex items-center gap-2 text-xs min-w-0 cursor-pointer">
              <input type="checkbox" checked={Boolean(m.completedAt)} onChange={() => toggleProjectMilestone(project.id, m.id)} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
              <span className={clsx('truncate', m.completedAt ? 'line-through text-slate-400' : 'text-slate-800')}>{m.title}</span>
              {m.dueDate && <span className="text-[10px] text-slate-400 shrink-0">due {formatDate(m.dueDate)}</span>}
            </label>
            <div className="flex shrink-0">
              {!m.completedAt && <TextButton onClick={() => createTaskFromMilestone(project.id, m.id)}><ListPlus className="w-3 h-3" />Task today</TextButton>}
              <TextButton tone="slate" aria-label="Remove milestone" onClick={() => removeProjectMilestone(project.id, m.id)}><Trash2 className="w-3 h-3" /></TextButton>
            </div>
          </div>
        ))}
        <form
          className="grid grid-cols-1 sm:grid-cols-[1fr_11rem_auto] gap-2"
          onSubmit={e => {
            e.preventDefault();
            if (!msTitle.trim()) return;
            addProjectMilestone(project.id, msTitle.trim(), msDue || undefined);
            setMsTitle('');
            setMsDue('');
          }}
        >
          <input className={inputClass} value={msTitle} onChange={e => setMsTitle(e.target.value)} placeholder="Add a milestone" aria-label="Milestone title" />
          <input type="date" className={inputClass} value={msDue} onChange={e => setMsDue(e.target.value)} aria-label="Milestone due date" />
          <Button type="submit" size="sm" variant="outline" disabled={!msTitle.trim()}>Add</Button>
        </form>
      </div>

      {project.blueprint && (
        <div className="mt-4">
          <TextButton onClick={() => setShowBlueprint(s => !s)}>{showBlueprint ? 'Hide' : 'Show'} project blueprint</TextButton>
          {showBlueprint && <BlueprintDetails bp={project.blueprint} />}
        </div>
      )}
    </Card>
  );
};

const BlueprintDetails: React.FC<{ bp: ProjectBlueprint }> = ({ bp }) => (
  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
    <div className="space-y-1"><p className="font-bold text-slate-800">Problem statement</p><p className="text-slate-600">{bp.problem}</p></div>
    <div className="space-y-1"><p className="font-bold text-slate-800">Why this project</p><ul className="list-disc pl-4 text-slate-600 space-y-0.5">{bp.why.map(w => <li key={w}>{w}</li>)}</ul></div>
    <div className="space-y-1"><p className="font-bold text-slate-800">Skills learned</p><div className="flex flex-wrap gap-1">{bp.skillsLearned.map(s => <Badge key={s}>{s}</Badge>)}</div></div>
    <div className="space-y-1"><p className="font-bold text-slate-800">Technology stack</p><div className="flex flex-wrap gap-1">{bp.stack.map(s => <Badge key={s} tone="indigo">{s}</Badge>)}</div></div>
    <div className="space-y-1"><p className="font-bold text-slate-800">Architecture</p><ul className="list-disc pl-4 text-slate-600 space-y-0.5">{bp.architecture.map(a => <li key={a}>{a}</li>)}</ul></div>
    <div className="space-y-1"><p className="font-bold text-slate-800">Features</p><ul className="list-disc pl-4 text-slate-600 space-y-0.5">{bp.features.map(a => <li key={a}>{a}</li>)}</ul></div>
    <div className="space-y-1"><p className="font-bold text-slate-800">Milestones & timeline (~{bp.timelineWeeks} weeks)</p><ol className="list-decimal pl-4 text-slate-600 space-y-0.5">{bp.milestones.map(m => <li key={m.title}>{m.title} — {m.weeks} week{m.weeks > 1 ? 's' : ''}</li>)}</ol></div>
    <div className="space-y-1"><p className="font-bold text-slate-800">Deployment</p><ul className="list-disc pl-4 text-slate-600 space-y-0.5">{bp.deployment.map(a => <li key={a}>{a}</li>)}</ul></div>
    <div className="space-y-1 md:col-span-2"><p className="font-bold text-slate-800">GitHub structure</p><pre className="p-3 rounded-lg bg-slate-900 text-slate-100 text-[11px] overflow-x-auto">{bp.githubStructure}</pre></div>
    <div className="space-y-1"><p className="font-bold text-slate-800">Resume bullet suggestions</p><ul className="list-disc pl-4 text-slate-600 space-y-0.5">{bp.resumeBullets.map(a => <li key={a}>{a}</li>)}</ul><p className="text-[10px] text-slate-400">Replace [placeholders] only with numbers you actually measured.</p></div>
    <div className="space-y-1"><p className="font-bold text-slate-800">Interview talking points</p><ul className="list-disc pl-4 text-slate-600 space-y-0.5">{bp.interviewPoints.map(a => <li key={a}>{a}</li>)}</ul></div>
  </div>
);

export const ProjectsTab: React.FC = () => {
  const { state, twin, addProject, adoptBlueprint } = useCareer();
  const { user } = useOnboarding();
  const [adding, setAdding] = useState(false);
  const [openBp, setOpenBp] = useState<string | null>(null);
  const analysis = useMemo(() => analyzePortfolio(user, state, twin), [user, state, twin]);
  const recs = useMemo(() => recommendProjects(user, twin, analysis), [user, twin, analysis]);
  const adopted = new Set(state.projects.map(p => p.blueprint?.key).filter(Boolean));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold text-slate-900">Projects</h2>
        <Button size="sm" onClick={() => setAdding(a => !a)} leftIcon={<Plus className="w-3.5 h-3.5" />}>Add project</Button>
      </div>

      {adding && (
        <ProjectEditor
          submitLabel="Add project"
          initial={emptyForm()}
          onCancel={() => setAdding(false)}
          onSave={f => {
            addProject({ title: f.title.trim(), description: f.description.trim(), repoUrl: f.repoUrl.trim(), deployUrl: f.deployUrl.trim(), startDate: f.startDate, deadline: f.deadline, techStack: parseStack(f.stack) });
            setAdding(false);
          }}
        />
      )}

      <Card>
        <CardHeader icon={<Lightbulb className="w-4 h-4" />} title="Portfolio analysis" subtitle="Based on your tracked projects" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
            <p className="font-bold text-slate-800 mb-1">Current</p>
            <p className="text-slate-600">{analysis.current.total} project{analysis.current.total === 1 ? '' : 's'} · {analysis.current.crud} CRUD-style · {analysis.current.ai} AI · {analysis.current.realtime} real-time · {analysis.current.deployed} deployed</p>
          </div>
          <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-100">
            <p className="font-bold text-amber-800 mb-1">Missing</p>
            <p className="text-slate-700">{analysis.missingCategories.join(', ') || 'Nothing major'}</p>
          </div>
          <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100">
            <p className="font-bold text-indigo-800 mb-1">Recommendation</p>
            <p className="text-slate-700">{recs[0] ? `Build "${recs[0].name}"` : 'Keep shipping your current projects'}{analysis.missingCategories.length ? ` to add ${analysis.missingCategories.slice(0, 2).join(' + ')}.` : '.'}</p>
          </div>
        </div>
      </Card>

      {state.projects.length ? (
        <div className="space-y-4">{state.projects.map(p => <ProjectCard key={p.id} project={p} />)}</div>
      ) : (
        <EmptyState icon={<FolderGit2 className="w-6 h-6" />} title="No projects tracked yet" body="Add a project you're building, track a GitHub repo from the Coding tab, or adopt a recommended project below." />
      )}

      <div className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2"><Sparkles className="w-4 h-4 text-indigo-600" />Recommended for {user.career.dreamCompany || twin.career.targetRole}</h2>
        <p className="text-xs text-slate-500">Ranked by how many of your skill gaps and portfolio gaps each project closes, sized to your available time.</p>
        {recs.map(bp => (
          <Card key={bp.key}>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <h3 className="text-sm font-bold text-slate-900">{bp.name}</h3>
                <p className="text-xs text-slate-600">{bp.problem}</p>
                <ul className="text-[11px] text-slate-600 list-disc pl-4 pt-1 space-y-0.5">{bp.why.slice(0, 3).map(w => <li key={w}>{w}</li>)}</ul>
              </div>
              <div className="flex sm:flex-col gap-2 shrink-0">
                {adopted.has(bp.key)
                  ? <Badge tone="emerald"><Check className="w-3 h-3" />Adopted</Badge>
                  : <Button size="sm" onClick={() => adoptBlueprint(bp)}>Adopt project</Button>}
                <Button size="sm" variant="ghost" onClick={() => setOpenBp(o => (o === bp.key ? null : bp.key))}>{openBp === bp.key ? 'Hide details' : 'Full blueprint'}</Button>
              </div>
            </div>
            {openBp === bp.key && <BlueprintDetails bp={bp} />}
          </Card>
        ))}
      </div>
    </div>
  );
};
