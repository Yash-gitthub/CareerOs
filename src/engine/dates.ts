// Date helpers. All "dates" are local calendar days as YYYY-MM-DD strings.

const pad = (n: number) => String(n).padStart(2, '0');

export const toISODate = (d: Date): string =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const fromISODate = (s: string): Date => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

export const today = (now: Date = new Date()): string => toISODate(now);

// Local calendar day of an ISO timestamp. Never slice timestamps: they're UTC,
// so `.slice(0, 10)` puts early-morning activity on the previous day in UTC+ zones.
export const localDate = (isoDateTime?: string): string => {
  if (!isoDateTime) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoDateTime)) return isoDateTime;
  return toISODate(new Date(isoDateTime));
};

export const addDays = (iso: string, days: number): string => {
  const d = fromISODate(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
};

// Monday of the week containing `iso`.
export const weekStart = (iso: string): string => {
  const d = fromISODate(iso);
  const offset = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - offset);
  return toISODate(d);
};

export const daysBetween = (a: string, b: string): number =>
  Math.round((fromISODate(b).getTime() - fromISODate(a).getTime()) / 86_400_000);

export const isWithin = (iso: string, start: string, endInclusive: string) =>
  iso >= start && iso <= endInclusive;

export const formatDate = (iso: string, opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }) =>
  fromISODate(iso).toLocaleDateString(undefined, opts);

export const timeAgo = (isoDateTime: string | undefined, now: Date = new Date()): string => {
  if (!isoDateTime) return 'never';
  const diff = Math.max(0, now.getTime() - new Date(isoDateTime).getTime());
  const mins = Math.round(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
};

export const uid = (prefix = 'id'): string =>
  `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

export const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));

export const round1 = (v: number) => Math.round(v * 10) / 10;
