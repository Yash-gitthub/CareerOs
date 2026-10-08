import React, { useState } from 'react';
import { RefreshCw, AlertTriangle, CheckCircle2, Star, GitFork, ExternalLink, Code2, Unplug, PencilLine } from 'lucide-react';
import { useCareer } from '../../../store/CareerStore';
import { timeAgo } from '../../../engine/dates';
import { DSA_TOPICS } from '../../../engine/roleRequirements';
import { Button } from '../../common/Button';
import { Badge, Field, TextButton, inputClass } from '../ui';

const GitHubMark: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
  </svg>
);

const SyncError: React.FC<{ message?: string; lastSuccessAt?: string; onRetry: () => void; busy: boolean }> = ({ message, lastSuccessAt, onRetry, busy }) => (
  <div role="alert" className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1.5">
    <div className="flex items-center gap-1.5 font-semibold"><AlertTriangle className="w-3.5 h-3.5" />Unable to sync.</div>
    {message && <p>{message}</p>}
    <p className="text-amber-800">Last successful sync: {lastSuccessAt ? timeAgo(lastSuccessAt) : 'never'}.</p>
    <Button size="sm" variant="outline" onClick={onRetry} disabled={busy} leftIcon={<RefreshCw className="w-3 h-3" />}>Retry</Button>
  </div>
);

export const GitHubCard: React.FC = () => {
  const { state, syncGitHub, disconnectGitHub } = useCareer();
  const gh = state.github;
  const [username, setUsername] = useState(gh.username);
  const syncing = gh.status === 'syncing';
  const snap = gh.snapshot;

  return (
    <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
          <GitHubMark className="w-4 h-4" />GitHub
        </div>
        {snap && gh.status !== 'error' && <Badge tone="emerald"><CheckCircle2 className="w-3 h-3" />Connected</Badge>}
      </div>

      {snap ? (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <img src={snap.avatarUrl} alt="" className="w-9 h-9 rounded-full border border-slate-200" />
            <div className="min-w-0">
              <a href={snap.profileUrl} target="_blank" rel="noreferrer" className="text-xs font-semibold text-indigo-600 hover:underline inline-flex items-center gap-1">
                @{snap.username}<ExternalLink className="w-3 h-3" />
              </a>
              <p className="text-[11px] text-slate-500">Synced {timeAgo(snap.syncedAt)} · public data only</p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
            <div className="p-2 rounded-lg bg-slate-50"><div className="font-bold text-slate-900 tabular-nums">{snap.repos.filter(r => !r.isFork).length}</div><div className="text-slate-500">Repos</div></div>
            <div className="p-2 rounded-lg bg-slate-50"><div className="font-bold text-slate-900 tabular-nums">{snap.stars}</div><div className="text-slate-500">Stars</div></div>
            <div className="p-2 rounded-lg bg-slate-50"><div className="font-bold text-slate-900 tabular-nums">{snap.forks}</div><div className="text-slate-500">Forks</div></div>
            <div className="p-2 rounded-lg bg-slate-50"><div className="font-bold text-slate-900 tabular-nums">{snap.pushDays30}</div><div className="text-slate-500">Active days (30d)</div></div>
          </div>
          {Object.keys(snap.languages).length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(snap.languages).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([lang, n]) => (
                <Badge key={lang}>{lang} · {n}</Badge>
              ))}
            </div>
          )}
        </div>
      ) : (
        <p className="text-[11px] text-slate-500 leading-relaxed">
          Connect your GitHub username to analyse public repositories, languages and recent activity. Nothing private is accessed.
        </p>
      )}

      {gh.status === 'error' && (
        <SyncError message={gh.lastError} lastSuccessAt={gh.lastSuccessAt} busy={syncing} onRetry={() => syncGitHub(username || gh.username)} />
      )}

      <form className="flex gap-2" onSubmit={e => { e.preventDefault(); syncGitHub(username); }}>
        <input className={inputClass} value={username} onChange={e => setUsername(e.target.value)} placeholder="GitHub username" aria-label="GitHub username" />
        <Button type="submit" size="sm" isLoading={syncing} className="shrink-0">{snap ? 'Re-sync' : 'Connect'}</Button>
      </form>
      {syncing && <p className="text-[11px] text-indigo-600">Syncing GitHub…</p>}
      {snap && (
        <TextButton tone="slate" onClick={disconnectGitHub}><Unplug className="w-3 h-3" />Disconnect</TextButton>
      )}
    </div>
  );
};

export const RecentRepos: React.FC<{ limit?: number; onTrack?: (repo: { name: string; url: string; description: string; language: string | null; homepage: string | null }) => void }> = ({ limit = 6, onTrack }) => {
  const { state } = useCareer();
  const repos = (state.github.snapshot?.repos || []).filter(r => !r.isFork).slice(0, limit);
  const tracked = new Set(state.projects.map(p => p.repoUrl.toLowerCase()));
  if (!repos.length) return null;
  return (
    <div className="space-y-2">
      {repos.map(r => (
        <div key={r.url} className="p-3 rounded-lg border border-slate-200 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <a href={r.url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-indigo-600 hover:underline">{r.name}</a>
            {r.description && <p className="text-[11px] text-slate-500 line-clamp-2">{r.description}</p>}
            <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1">
              {r.language && <span>{r.language}</span>}
              <span className="inline-flex items-center gap-0.5"><Star className="w-3 h-3" />{r.stars}</span>
              <span className="inline-flex items-center gap-0.5"><GitFork className="w-3 h-3" />{r.forks}</span>
              <span>pushed {timeAgo(r.pushedAt)}</span>
            </div>
          </div>
          {onTrack && (
            tracked.has(r.url.toLowerCase())
              ? <Badge tone="emerald">Tracked</Badge>
              : <TextButton onClick={() => onTrack(r)}>Track as project</TextButton>
          )}
        </div>
      ))}
    </div>
  );
};

export const LeetCodeCard: React.FC = () => {
  const { state, syncLeetCode, saveManualLeetCode, disconnectLeetCode } = useCareer();
  const lc = state.leetcode;
  const [username, setUsername] = useState(lc.username);
  const [manual, setManual] = useState(false);
  const [counts, setCounts] = useState({ easy: lc.snapshot?.easy ?? 0, medium: lc.snapshot?.medium ?? 0, hard: lc.snapshot?.hard ?? 0 });
  const [tags, setTags] = useState<Record<string, number>>({});
  const syncing = lc.status === 'syncing';
  const snap = lc.snapshot;

  return (
    <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-900"><Code2 className="w-4 h-4 text-amber-600" />LeetCode</div>
        {snap && lc.status !== 'error' && (
          snap.source === 'manual' ? <Badge tone="amber">Self-reported</Badge> : <Badge tone="emerald"><CheckCircle2 className="w-3 h-3" />Connected</Badge>
        )}
      </div>

      {snap ? (
        <div className="space-y-2">
          <p className="text-[11px] text-slate-500">@{snap.username} · updated {timeAgo(snap.syncedAt)}</p>
          <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
            <div className="p-2 rounded-lg bg-slate-50"><div className="font-bold text-slate-900 tabular-nums">{snap.total}</div><div className="text-slate-500">Solved</div></div>
            <div className="p-2 rounded-lg bg-slate-50"><div className="font-bold text-slate-900 tabular-nums">{snap.easy}</div><div className="text-slate-500">Easy</div></div>
            <div className="p-2 rounded-lg bg-slate-50"><div className="font-bold text-slate-900 tabular-nums">{snap.medium}</div><div className="text-slate-500">Medium</div></div>
            <div className="p-2 rounded-lg bg-slate-50"><div className="font-bold text-slate-900 tabular-nums">{snap.hard}</div><div className="text-slate-500">Hard</div></div>
          </div>
          {snap.contestRating !== null && (
            <p className="text-[11px] text-slate-600">Contest rating <strong>{snap.contestRating}</strong>{snap.contestsAttended ? ` · ${snap.contestsAttended} contests` : ''}</p>
          )}
        </div>
      ) : (
        <p className="text-[11px] text-slate-500 leading-relaxed">
          Connect your LeetCode username to track solved problems, difficulty mix and topic coverage. Stats are never estimated.
        </p>
      )}

      {lc.status === 'error' && (
        <SyncError message={lc.lastError} lastSuccessAt={lc.lastSuccessAt} busy={syncing} onRetry={() => syncLeetCode(username || lc.username)} />
      )}

      <form className="flex gap-2" onSubmit={e => { e.preventDefault(); syncLeetCode(username); }}>
        <input className={inputClass} value={username} onChange={e => setUsername(e.target.value)} placeholder="LeetCode username" aria-label="LeetCode username" />
        <Button type="submit" size="sm" isLoading={syncing} className="shrink-0">{snap ? 'Re-sync' : 'Connect'}</Button>
      </form>
      {syncing && <p className="text-[11px] text-indigo-600">Syncing LeetCode…</p>}

      <div className="flex flex-wrap gap-1">
        <TextButton tone="slate" onClick={() => setManual(m => !m)}><PencilLine className="w-3 h-3" />{manual ? 'Hide manual entry' : 'Enter stats manually'}</TextButton>
        {snap && <TextButton tone="slate" onClick={disconnectLeetCode}><Unplug className="w-3 h-3" />Disconnect</TextButton>}
      </div>

      {manual && (
        <form
          className="space-y-3 p-3 rounded-lg bg-slate-50 border border-slate-200"
          onSubmit={e => {
            e.preventDefault();
            const tagCounts: Record<string, number> = {};
            DSA_TOPICS.forEach(t => {
              if (tags[t.key]) tagCounts[t.lcTags[0]] = tags[t.key];
            });
            saveManualLeetCode(username, counts, tagCounts);
            setManual(false);
          }}
        >
          <p className="text-[11px] text-slate-500">Copy the numbers from your LeetCode profile page. They're labelled "self-reported".</p>
          <div className="grid grid-cols-3 gap-2">
            {(['easy', 'medium', 'hard'] as const).map(k => (
              <Field key={k} label={k[0].toUpperCase() + k.slice(1)}>
                <input type="number" min={0} max={5000} className={inputClass} value={counts[k]} onChange={e => setCounts({ ...counts, [k]: Number(e.target.value) })} />
              </Field>
            ))}
          </div>
          <details>
            <summary className="text-[11px] font-semibold text-slate-600 cursor-pointer">Problems solved per topic (optional)</summary>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2">
              {DSA_TOPICS.map(t => (
                <Field key={t.key} label={t.label}>
                  <input type="number" min={0} max={5000} className={inputClass} value={tags[t.key] ?? ''} onChange={e => setTags({ ...tags, [t.key]: Number(e.target.value) })} />
                </Field>
              ))}
            </div>
          </details>
          <Button type="submit" size="sm">Save stats</Button>
        </form>
      )}
    </div>
  );
};
