import type { LeetCodeSnapshot } from '../engine/types';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { SyncError } from './github';

const USERNAME_RE = /^[a-zA-Z0-9_-]{1,40}$/;

interface ProxyResponse {
  ok: boolean;
  code?: string;
  message?: string;
  data?: {
    username: string;
    easy: number;
    medium: number;
    hard: number;
    total: number;
    tagCounts: Record<string, number>;
    contestRating: number | null;
    contestsAttended: number | null;
    submissionsByDate: Record<string, number>;
  };
}

// LeetCode blocks browser requests (CORS), so stats come through the
// `leetcode-sync` Supabase Edge Function (supabase/functions/leetcode-sync).
export const syncLeetCode = async (rawUsername: string): Promise<LeetCodeSnapshot> => {
  const username = rawUsername.trim().replace(/^https?:\/\/leetcode\.com\/(u\/)?/i, '').replace(/\/.*$/, '');
  if (!username) throw new SyncError('missing_username', 'Enter your LeetCode username.');
  if (!USERNAME_RE.test(username)) throw new SyncError('invalid_username', 'That doesn\'t look like a valid LeetCode username.');

  if (!isSupabaseConfigured) {
    throw new SyncError('unavailable', 'Unable to sync right now — the LeetCode sync service is not configured. You can enter your stats manually.');
  }

  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new SyncError('timeout', 'LeetCode took too long to respond.')), 12_000)
  );

  let response: ProxyResponse;
  try {
    const { data, error } = await Promise.race([
      supabase.functions.invoke<ProxyResponse>('leetcode-sync', { body: { username } }),
      timeout,
    ]);
    if (error || !data) throw new SyncError('unavailable', 'Unable to sync right now — the LeetCode sync service did not respond.');
    response = data;
  } catch (err) {
    if (err instanceof SyncError) throw err;
    throw new SyncError('unavailable', 'Unable to sync right now.');
  }

  if (!response.ok || !response.data) {
    const code = response.code === 'not_found' ? 'not_found' : response.code === 'rate_limited' ? 'rate_limited' : 'upstream_error';
    throw new SyncError(code, response.message || 'Unable to sync right now.');
  }

  const d = response.data;
  if (d.total === 0 && !Object.keys(d.tagCounts).length) {
    throw new SyncError('empty', 'LeetCode returned no solved problems for this user yet.');
  }

  return { ...d, source: 'api', syncedAt: new Date().toISOString() };
};

export const manualLeetCode = (
  username: string,
  counts: { easy: number; medium: number; hard: number },
  tagCounts: Record<string, number>
): LeetCodeSnapshot => {
  const clean = (n: number) => Math.max(0, Math.min(5000, Math.floor(Number(n) || 0)));
  const easy = clean(counts.easy);
  const medium = clean(counts.medium);
  const hard = clean(counts.hard);
  return {
    username: username.trim() || 'self-reported',
    easy,
    medium,
    hard,
    total: easy + medium + hard,
    tagCounts: Object.fromEntries(Object.entries(tagCounts).map(([k, v]) => [k, clean(v)]).filter(([, v]) => (v as number) > 0)),
    contestRating: null,
    contestsAttended: null,
    submissionsByDate: {},
    source: 'manual',
    syncedAt: new Date().toISOString(),
  };
};
