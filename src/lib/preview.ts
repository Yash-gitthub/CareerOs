import type { DashboardTab } from '../engine/types';
import { FEATURE_JOURNEY } from '../engine/unlocks';

// Development-only preview: `?preview&tab=analytics` opens any dashboard section with the
// skill test and feature locks bypassed. Production builds ignore it (import.meta.env.DEV is false).
const params = () => new URLSearchParams(typeof window === 'undefined' ? '' : window.location.search);

export const isPreview = (): boolean => import.meta.env.DEV && params().has('preview');

export const previewTab = (): DashboardTab | null => {
  if (!isPreview()) return null;
  const tab = params().get('tab');
  return FEATURE_JOURNEY.some(f => f.tab === tab) ? (tab as DashboardTab) : null;
};
