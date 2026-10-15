// localStorage keys for the Career OS store (kept separate to avoid import cycles).
export const CAREER_STATE_PREFIX = 'careeros_state_';
export const DASHBOARD_TAB_KEY = 'careeros_dashboard_tab';
// One-shot flag: a sign-in just happened, so the dashboard should open on the roadmap.
export const OPEN_ROADMAP_KEY = 'careeros_open_roadmap';

export const clearAllCareerState = () => {
  try {
    Object.keys(localStorage)
      .filter(k => k.startsWith(CAREER_STATE_PREFIX) || k === DASHBOARD_TAB_KEY)
      .forEach(k => localStorage.removeItem(k));
  } catch {
    // Storage unavailable — nothing to clear.
  }
};
