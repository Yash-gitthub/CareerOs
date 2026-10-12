import React from 'react';
import { clsx } from 'clsx';

// Monospace terminal-style label, e.g. `// SYSTEM STATUS: ONLINE` or `● LIVE_FEED`.
export const TerminalLabel: React.FC<{ children: React.ReactNode; live?: boolean; className?: string }> = ({ children, live, className }) => (
  <span className={clsx('term-label inline-flex items-center gap-2.5', className)}>
    {live && <span className="status-dot" aria-hidden="true" />}
    {children}
  </span>
);
