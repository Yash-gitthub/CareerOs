import React, { useEffect, useRef, useState } from 'react';
import { clsx } from 'clsx';
import { Bell, CheckCheck, Settings2, X } from 'lucide-react';
import { useCareer } from '../../store/CareerStore';
import type { NotificationType } from '../../engine/types';
import { timeAgo } from '../../engine/dates';

const TYPE_LABEL: Record<NotificationType, string> = {
  task_reminder: 'Task reminders',
  upcoming_task: 'Upcoming session (30 min before)',
  overdue: 'Overdue tasks',
  github_reminder: 'GitHub inactivity',
  learning_reminder: 'Learning reminders',
  weekly_review: 'Weekly review ready',
  twin_update: 'Career Twin updates',
  intervention: 'Personalized interventions',
};

export const NotificationCenter: React.FC = () => {
  const { state, markNotificationRead, markAllNotificationsRead, setNotificationPrefs, enableBrowserNotifications, setActiveTab } = useCareer();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<'list' | 'prefs'>('list');
  const [permissionMsg, setPermissionMsg] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const unread = state.notifications.filter(n => !n.readAt).length;
  const prefs = state.notificationPrefs;

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => { setOpen(o => !o); setView('list'); }}
        aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
        aria-expanded={open}
        className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
      >
        <Bell className="w-[18px] h-[18px]" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[min(24rem,calc(100vw-2rem))] bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden" role="dialog" aria-label="Notification center">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <span className="text-sm font-bold text-slate-900">{view === 'list' ? 'Notifications' : 'Notification preferences'}</span>
            <div className="flex items-center gap-1">
              {view === 'list' && unread > 0 && (
                <button onClick={markAllNotificationsRead} className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 px-1.5 py-1 rounded">
                  <CheckCheck className="w-3.5 h-3.5" />Mark all read
                </button>
              )}
              <button onClick={() => setView(v => (v === 'list' ? 'prefs' : 'list'))} aria-label={view === 'list' ? 'Preferences' : 'Back to notifications'} className="p-1.5 rounded text-slate-500 hover:bg-slate-100">
                {view === 'list' ? <Settings2 className="w-4 h-4" /> : <X className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {view === 'list' ? (
            <ul className="max-h-[60vh] overflow-y-auto divide-y divide-slate-100">
              {state.notifications.length ? state.notifications.slice(0, 50).map(n => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => {
                      markNotificationRead(n.id);
                      if (n.tab) setActiveTab(n.tab);
                      setOpen(false);
                    }}
                    className={clsx('w-full text-left px-4 py-3 hover:bg-slate-50 flex gap-3', !n.readAt && 'bg-indigo-50/40')}
                  >
                    <span className={clsx('mt-1.5 w-2 h-2 rounded-full shrink-0', n.readAt ? 'bg-transparent' : 'bg-indigo-600')} aria-hidden="true" />
                    <span className="min-w-0">
                      <span className="block text-xs font-semibold text-slate-900">{n.title}</span>
                      <span className="block text-[11px] text-slate-600 leading-relaxed">{n.body}</span>
                      <span className="block text-[10px] text-slate-400 mt-0.5">{timeAgo(n.createdAt)}{n.readAt ? ' · read' : ''}</span>
                    </span>
                  </button>
                </li>
              )) : (
                <li className="px-4 py-8 text-center text-xs text-slate-500">No notifications yet. Reminders and Twin updates will appear here.</li>
              )}
            </ul>
          ) : (
            <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
              {(Object.keys(TYPE_LABEL) as NotificationType[]).map(type => (
                <label key={type} className="flex items-center justify-between gap-3 text-xs text-slate-700 cursor-pointer">
                  <span>{TYPE_LABEL[type]}</span>
                  <input
                    type="checkbox"
                    checked={prefs.enabled[type]}
                    onChange={e => setNotificationPrefs({ ...prefs, enabled: { ...prefs.enabled, [type]: e.target.checked } })}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </label>
              ))}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <label className="flex items-center justify-between gap-3 text-xs text-slate-700 cursor-pointer">
                  <span>Browser notifications (while CareerOS is open)</span>
                  <input
                    type="checkbox"
                    checked={prefs.browser}
                    onChange={async e => {
                      if (!e.target.checked) {
                        setNotificationPrefs({ ...prefs, browser: false });
                        setPermissionMsg('');
                        return;
                      }
                      const result = await enableBrowserNotifications();
                      setPermissionMsg(result === 'granted' ? 'Browser notifications enabled.' : result === 'denied' ? 'Permission denied — enable notifications for this site in your browser settings.' : 'This browser does not support notifications.');
                    }}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </label>
                {permissionMsg && <p className="text-[11px] text-slate-500">{permissionMsg}</p>}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
