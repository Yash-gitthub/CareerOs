import type { GitHubSnapshot, GitHubRepo, SyncErrorCode } from '../engine/types';
import { addDays, toISODate, today as todayISO } from '../engine/dates';

export class SyncError extends Error {
  code: SyncErrorCode;
  constructor(code: SyncErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

const USERNAME_RE = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;
const TIMEOUT_MS = 10_000;

const fetchJson = async (url: string): Promise<unknown> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { headers: { Accept: 'application/vnd.github+json' }, signal: controller.signal });
    if (res.status === 404) throw new SyncError('not_found', 'GitHub user not found. Check the username.');
    if (res.status === 401) throw new SyncError('auth_failed', 'GitHub rejected the request (authentication failed).');
    if (res.status === 403 || res.status === 429) {
      const reset = Number(res.headers.get('x-ratelimit-reset'));
      const when = reset ? new Date(reset * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'later';
      throw new SyncError('rate_limited', `GitHub rate limit reached. Try again after ${when}.`);
    }
    if (!res.ok) throw new SyncError('upstream_error', `GitHub returned an error (${res.status}).`);
    return await res.json();
  } catch (err) {
    if (err instanceof SyncError) throw err;
    if (err instanceof DOMException && err.name === 'AbortError') throw new SyncError('timeout', 'GitHub took too long to respond.');
    throw new SyncError('upstream_error', 'Could not reach GitHub. Check your connection.');
  } finally {
    clearTimeout(timer);
  }
};

interface RawUser { login: string; avatar_url: string; html_url: string; public_repos: number; followers: number }
interface RawRepo {
  name: string; html_url: string; description: string | null; language: string | null;
  stargazers_count: number; forks_count: number; pushed_at: string; fork: boolean;
  homepage: string | null; topics?: string[];
}
interface RawEvent { type: string; created_at: string }

// Public data only — no token, no private repositories.
export const syncGitHub = async (rawUsername: string): Promise<GitHubSnapshot> => {
  const username = rawUsername.trim().replace(/^@/, '').replace(/^https?:\/\/github\.com\//i, '').replace(/\/.*$/, '');
  if (!username) throw new SyncError('missing_username', 'Enter your GitHub username.');
  if (!USERNAME_RE.test(username)) throw new SyncError('invalid_username', 'That doesn\'t look like a valid GitHub username.');

  const user = (await fetchJson(`https://api.github.com/users/${encodeURIComponent(username)}`)) as RawUser;
  const [reposRaw, eventsRaw] = await Promise.all([
    fetchJson(`https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100&sort=pushed`),
    // Events are optional (partial data is fine if this fails).
    fetchJson(`https://api.github.com/users/${encodeURIComponent(username)}/events/public?per_page=100`).catch(() => []),
  ]);

  if (!Array.isArray(reposRaw)) throw new SyncError('empty', 'GitHub returned no repository data.');

  const repos: GitHubRepo[] = (reposRaw as RawRepo[]).map(r => ({
    name: r.name,
    url: r.html_url,
    description: r.description || '',
    language: r.language,
    stars: r.stargazers_count || 0,
    forks: r.forks_count || 0,
    pushedAt: r.pushed_at,
    isFork: r.fork,
    homepage: r.homepage || null,
    topics: r.topics || [],
  }));

  const languages: Record<string, number> = {};
  repos.filter(r => !r.isFork && r.language).forEach(r => {
    languages[r.language as string] = (languages[r.language as string] || 0) + 1;
  });

  const activeDates = Array.from(new Set(
    (Array.isArray(eventsRaw) ? (eventsRaw as RawEvent[]) : [])
      .filter(e => e.type === 'PushEvent' || e.type === 'CreateEvent' || e.type === 'PullRequestEvent')
      .map(e => toISODate(new Date(e.created_at)))
  )).sort();
  const monthAgo = addDays(todayISO(), -29);
  // Fall back to repository push dates when the events feed is empty.
  const pushDates = activeDates.length
    ? activeDates
    : Array.from(new Set(repos.map(r => toISODate(new Date(r.pushedAt))))).sort();

  return {
    username: user.login,
    avatarUrl: user.avatar_url,
    profileUrl: user.html_url,
    publicRepos: user.public_repos,
    followers: user.followers,
    repos,
    languages,
    stars: repos.reduce((s, r) => s + r.stars, 0),
    forks: repos.reduce((s, r) => s + r.forks, 0),
    pushDays30: pushDates.filter(d => d >= monthAgo).length,
    activeDates: pushDates,
    syncedAt: new Date().toISOString(),
  };
};
