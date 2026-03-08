import { useEffect, useState } from 'react';
import { Bell, MessageSquare, Check, CheckCheck, Info, AlertTriangle, Megaphone } from 'lucide-react';
import useNotificationStore from '../stores/notificationStore';

const TYPE_CONFIG: Record<string, { icon: any; color: string; bg: string }> = {
  SESSION: { icon: Info, color: '#6366f1', bg: '#eef2ff' },
  ASSIGNMENT: { icon: AlertTriangle, color: '#f59e0b', bg: '#fffbeb' },
  GENERAL: { icon: Bell, color: '#6366f1', bg: '#eef2ff' },
  SYSTEM: { icon: Info, color: '#64748b', bg: '#f1f5f9' },
};

export default function Notifications() {
  const { notifications, announcements, unreadCount, refresh, markAsRead } = useNotificationStore();
  const [activeTab, setActiveTab] = useState<'notifications' | 'announcements'>('notifications');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      await refresh();
      setLoading(false);
    })();
  }, []);

  const groupByDate = (items: any[]) => {
    const groups: Record<string, any[]> = {};
    items.forEach((item) => {
      const d = new Date(item.sentAt || item.createdAt);
      const now = new Date();
      const isToday = d.toDateString() === now.toDateString();
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const isYesterday = d.toDateString() === yesterday.toDateString();

      let label: string;
      if (isToday) label = 'Today';
      else if (isYesterday) label = 'Yesterday';
      else label = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

      if (!groups[label]) groups[label] = [];
      groups[label].push(item);
    });
    return groups;
  };

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto p-8 page-enter">
        <div className="mb-8">
          <div className="h-8 w-48 shimmer rounded-lg mb-2" />
          <div className="h-4 w-64 shimmer rounded-lg" />
        </div>
        <div className="flex gap-3 mb-6">
          <div className="h-10 w-36 shimmer rounded-xl" />
          <div className="h-10 w-36 shimmer rounded-xl" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white rounded-xl p-4 card-shadow border border-slate-100">
              <div className="flex gap-3">
                <div className="w-10 h-10 shimmer rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 shimmer rounded" />
                  <div className="h-3 w-full shimmer rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const notifGroups = groupByDate(notifications);
  const announceGroups = groupByDate(announcements);

  return (
    <div className="flex-1 overflow-y-auto p-8 page-enter">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Notifications</h1>
        <p className="text-sm text-slate-500 mt-1">
          {unreadCount > 0
            ? <span>You have <span className="font-semibold text-indigo-600">{unreadCount}</span> unread notification{unreadCount > 1 ? 's' : ''}</span>
            : <span className="flex items-center gap-1.5"><CheckCheck size={14} className="text-emerald-500" /> All caught up!</span>
          }
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 p-1 bg-slate-100 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('notifications')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all
            ${activeTab === 'notifications' ? 'bg-white text-slate-900 card-shadow' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Bell size={15} />
          Notifications
          {unreadCount > 0 && (
            <span className="ml-0.5 min-w-[20px] h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1.5">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('announcements')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all
            ${activeTab === 'announcements' ? 'bg-white text-slate-900 card-shadow' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Megaphone size={15} />
          Announcements
          {announcements.length > 0 && (
            <span className="ml-0.5 min-w-[20px] h-5 rounded-full bg-slate-300 text-slate-700 text-[10px] font-bold flex items-center justify-center px-1.5">
              {announcements.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'notifications' ? (
        notifications.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center card-shadow-lg border border-slate-100">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center mx-auto mb-5">
              <Bell size={36} className="text-indigo-400" />
            </div>
            <p className="text-xl font-semibold text-slate-800">No notifications</p>
            <p className="text-sm text-slate-400 mt-2">You're all caught up! New notifications will appear here.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(notifGroups).map(([date, items]) => (
              <div key={date}>
                <div className="flex items-center gap-3 mb-3">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{date}</p>
                  <div className="flex-1 h-px bg-slate-100" />
                </div>
                <div className="space-y-2">
                  {items.map((n: any) => {
                    const typeConf = TYPE_CONFIG[n.type] || TYPE_CONFIG.GENERAL;
                    const TypeIcon = typeConf.icon;
                    return (
                      <div key={n.id}
                           className={`bg-white rounded-xl p-4 card-shadow border transition-all hover-lift cursor-default
                             ${n.isRead ? 'border-slate-100' : 'border-indigo-200 ring-1 ring-indigo-100'}`}>
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                               style={{ backgroundColor: n.isRead ? '#f1f5f9' : typeConf.bg }}>
                            <TypeIcon size={16} style={{ color: n.isRead ? '#94a3b8' : typeConf.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className={`text-sm leading-snug ${n.isRead ? 'text-slate-600' : 'text-slate-900 font-semibold'}`}>
                                  {n.title}
                                </p>
                                {n.message && <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{n.message}</p>}
                              </div>
                              {!n.isRead && (
                                <button
                                  onClick={() => markAsRead(n.id)}
                                  className="shrink-0 p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-500 transition-colors"
                                  title="Mark as read"
                                >
                                  <Check size={16} />
                                </button>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 mt-2">
                              {new Date(n.sentAt || n.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        announcements.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center card-shadow-lg border border-slate-100">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center mx-auto mb-5">
              <Megaphone size={36} className="text-amber-400" />
            </div>
            <p className="text-xl font-semibold text-slate-800">No announcements</p>
            <p className="text-sm text-slate-400 mt-2">Important announcements will appear here.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(announceGroups).map(([date, items]) => (
              <div key={date}>
                <div className="flex items-center gap-3 mb-3">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{date}</p>
                  <div className="flex-1 h-px bg-slate-100" />
                </div>
                <div className="space-y-2">
                  {items.map((a: any) => (
                    <div key={a.id} className="bg-white rounded-xl p-5 card-shadow border border-slate-100 hover-lift">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center shrink-0">
                          <Megaphone size={16} className="text-amber-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-900">{a.title}</p>
                          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{a.content || a.message}</p>
                          <p className="text-[11px] text-slate-400 mt-2">
                            {new Date(a.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            {' at '}
                            {new Date(a.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
