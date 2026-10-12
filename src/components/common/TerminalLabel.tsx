import React from 'react';
import { clsx } from 'clsx';

// Small uppercase section label, e.g. "YOUR CAREER TWIN" or "● TODAY'S JOURNEY".
export const TerminalLabel: React.FC<{ children: React.ReactNode; live?: boolean; className?: string }> = ({ children, live, className }) => (
  <span className={clsx('eyebrow inline-flex items-center gap-2', className)}>
    {live && <span className="status-dot" aria-hidden="true" />}
    {children}
  </span>
);
