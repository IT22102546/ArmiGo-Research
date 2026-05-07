import { useEffect, useState } from 'react';
import { ClipboardList, Calendar, Play, Clock, User, Search, Filter, CheckCircle, AlertCircle } from 'lucide-react';
import { apiFetch } from '../utils/api';

const extractData = (p: any) => p?.success && p?.data ? p.data : p;
const formatDate = (v?: string | null) => {
  if (!v) return 'Not set';
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? 'Not set' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const STATUS_CONFIG: Record<string, { bg: string; text: string; icon: any; dot: string }> = {
  ACTIVE: { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: Play, dot: 'bg-emerald-500' },
  COMPLETED: { bg: 'bg-slate-50', text: 'text-slate-500', icon: CheckCircle, dot: 'bg-slate-400' },
  PENDING: { bg: 'bg-amber-50', text: 'text-amber-600', icon: Clock, dot: 'bg-amber-500' },
  OVERDUE: { bg: 'bg-red-50', text: 'text-red-600', icon: AlertCircle, dot: 'bg-red-500' },
};

export default function Assignments() {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    (async () => {
      try {
        let childId = '';
        const profileRes = await apiFetch('/api/v1/users/mobile/profile', { method: 'GET' });
        if (profileRes.ok) {
          const json = await profileRes.json();
          const data = extractData(json);
          childId = data?.children?.[0]?.id || '';
        }
        const endpoint = childId ? `/api/v1/users/my-assignments?childId=${encodeURIComponent(childId)}` : '/api/v1/users/my-assignments';
        const res = await apiFetch(endpoint, { method: 'GET' });
        if (res.ok) {
          const json = await res.json();
          const root = extractData(json);
          let items: any[] = [];
          if (Array.isArray(root)) items = root;
          else if (Array.isArray(root?.assignments)) items = root.assignments;
          setAssignments(items);
        }
      } catch {} finally { setLoading(false); }
    })();
  }, []);

  const filtered = filter === 'all' ? assignments : assignments.filter(
    (a) => String(a.status || '').toUpperCase() === filter.toUpperCase()
  );

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto p-8 page-enter">
        <div className="mb-8">
          <div className="h-8 w-48 shimmer rounded-lg mb-2" />
          <div className="h-4 w-64 shimmer rounded-lg" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-5 card-shadow border border-slate-100">
              <div className="flex gap-3 mb-4">
                <div className="w-11 h-11 shimmer rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 shimmer rounded" />
                  <div className="h-3 w-1/3 shimmer rounded" />
                </div>
              </div>
              <div className="h-3 w-full shimmer rounded mb-2" />
              <div className="h-3 w-2/3 shimmer rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-8 page-enter">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Assignments</h1>
          <p className="text-sm text-slate-500 mt-1">
            {assignments.length > 0 ? `${assignments.length} therapy assignments` : 'Track and manage your therapy assignments'}
          </p>
        </div>
      </div>

      {/* Filter pills */}
      {assignments.length > 0 && (
        <div className="flex gap-2 mb-6">
          {['all', 'ACTIVE', 'COMPLETED', 'PENDING'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all capitalize
                ${filter === f ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200'}`}
            >
              {f === 'all' ? 'All' : f.toLowerCase()}
              {f !== 'all' && (
                <span className="ml-1.5 opacity-70">
                  ({assignments.filter(a => String(a.status || '').toUpperCase() === f).length})
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center card-shadow-lg border border-slate-100">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-50 to-green-50 flex items-center justify-center mx-auto mb-5">
            <ClipboardList size={36} className="text-emerald-500" />
          </div>
          <p className="text-xl font-semibold text-slate-800">
            {filter !== 'all' ? `No ${filter.toLowerCase()} assignments` : 'No assignments yet'}
          </p>
          <p className="text-sm text-slate-400 mt-2">Your therapy assignments will appear here</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((a: any) => {
            const status = String(a.status || 'PENDING').toUpperCase();
            const config = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
            const StatusIcon = config.icon;
            return (
              <div key={a.id} className="bg-white rounded-2xl p-5 card-shadow border border-slate-100 hover-lift">
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${config.bg}`}>
                    <StatusIcon size={18} className={config.text} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-900 truncate leading-snug">{a.title}</p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                      <span className={`text-[10px] font-semibold uppercase ${config.text}`}>
                        {a.status || 'Pending'}
                      </span>
                    </div>
                  </div>
                </div>

                {a.description && (
                  <p className="text-xs text-slate-500 mb-4 line-clamp-2 leading-relaxed">{a.description}</p>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Calendar size={12} />
                    <span className="text-[11px]">Due: {formatDate(a.dueDate)}</span>
                  </div>
                  {a.physiotherapist?.name && (
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <User size={11} />
                      <span className="text-[11px]">{a.physiotherapist.name}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
