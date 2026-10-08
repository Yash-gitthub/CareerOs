// Supabase Edge Function: leetcode-sync
// Fetches PUBLIC LeetCode stats server-side (LeetCode blocks browser CORS).
// Deploy:  supabase functions deploy leetcode-sync
// The endpoint is unofficial, so every field is validated and failures return
// structured errors instead of throwing.

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const QUERY = `
query careerOsStats($username: String!) {
  matchedUser(username: $username) {
    username
    submitStatsGlobal { acSubmissionNum { difficulty count } }
    tagProblemCounts {
      advanced { tagName problemsSolved }
      intermediate { tagName problemsSolved }
      fundamental { tagName problemsSolved }
    }
    userCalendar { submissionCalendar }
  }
  userContestRanking(username: $username) { rating attendedContestsCount }
}`;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

const toISODate = (d: Date) => d.toISOString().slice(0, 10);

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ ok: false, code: 'bad_request', message: 'Use POST.' }, 405);

  let username = '';
  try {
    const body = await req.json();
    username = String(body?.username || '').trim();
  } catch {
    return json({ ok: false, code: 'bad_request', message: 'Invalid JSON body.' }, 400);
  }
  if (!/^[a-zA-Z0-9_-]{1,40}$/.test(username)) {
    return json({ ok: false, code: 'invalid_username', message: 'Invalid LeetCode username.' }, 400);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  let payload: any;
  try {
    const res = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Referer: 'https://leetcode.com' },
      body: JSON.stringify({ query: QUERY, variables: { username } }),
      signal: controller.signal,
    });
    if (res.status === 429) return json({ ok: false, code: 'rate_limited', message: 'LeetCode is rate limiting requests. Try again later.' });
    if (!res.ok) return json({ ok: false, code: 'upstream_error', message: `LeetCode returned ${res.status}.` });
    payload = await res.json();
  } catch (err) {
    const timeout = err instanceof DOMException && err.name === 'AbortError';
    return json({ ok: false, code: timeout ? 'timeout' : 'upstream_error', message: timeout ? 'LeetCode timed out.' : 'Could not reach LeetCode.' });
  } finally {
    clearTimeout(timer);
  }

  const user = payload?.data?.matchedUser;
  if (!user) return json({ ok: false, code: 'not_found', message: 'LeetCode user not found.' });

  const counts: Record<string, number> = {};
  for (const row of user.submitStatsGlobal?.acSubmissionNum || []) {
    if (row && typeof row.difficulty === 'string') counts[row.difficulty] = Number(row.count) || 0;
  }

  const tagCounts: Record<string, number> = {};
  for (const level of ['fundamental', 'intermediate', 'advanced']) {
    for (const t of user.tagProblemCounts?.[level] || []) {
      if (t?.tagName) tagCounts[t.tagName] = Math.max(tagCounts[t.tagName] || 0, Number(t.problemsSolved) || 0);
    }
  }

  const submissionsByDate: Record<string, number> = {};
  try {
    const cal = JSON.parse(user.userCalendar?.submissionCalendar || '{}') as Record<string, number>;
    for (const [ts, n] of Object.entries(cal)) {
      const day = toISODate(new Date(Number(ts) * 1000));
      submissionsByDate[day] = (submissionsByDate[day] || 0) + (Number(n) || 0);
    }
  } catch {
    // Partial data: calendar unavailable.
  }

  const contest = payload?.data?.userContestRanking;
  return json({
    ok: true,
    data: {
      username: user.username,
      easy: counts.Easy || 0,
      medium: counts.Medium || 0,
      hard: counts.Hard || 0,
      total: counts.All ?? (counts.Easy || 0) + (counts.Medium || 0) + (counts.Hard || 0),
      tagCounts,
      contestRating: contest?.rating ? Math.round(contest.rating) : null,
      contestsAttended: contest?.attendedContestsCount ?? null,
      submissionsByDate,
    },
  });
});
