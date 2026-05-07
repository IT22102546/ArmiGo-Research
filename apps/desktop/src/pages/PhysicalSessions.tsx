import { useEffect, useState } from 'react';
import { Activity, Calendar, Clock, User, MapPin } from 'lucide-react';
import { apiFetch } from '../utils/api';

const extractData = (p: any) => p?.success && p?.data ? p.data : p;
const formatDate = (v?: string | null) => {
  if (!v) return 'Not set';
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? 'Not set' : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string; ring: string }> = {
  SCHEDULED: { bg: 'bg-blue-50', text: 'text-blue-600', dot: 'bg-blue-500', ring: 'ring-blue-100' },
  ACTIVE: { bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-500', ring: 'ring-emerald-100' },
  ONGOING: { bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-500', ring: 'ring-emerald-100' },
  COMPLETED: { bg: 'bg-slate-50', text: 'text-slate-500', dot: 'bg-slate-400', ring: 'ring-slate-100' },
  CANCELLED: { bg: 'bg-red-50', text: 'text-red-500', dot: 'bg-red-400', ring: 'ring-red-100' },
};

export default function PhysicalSessions() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        let childId = '';
        const profileRes = await apiFetch('/api/v1/users/mobile/profile', { method: 'GET' });
        if (profileRes.ok) {
          const json = await profileRes.json();
          childId = extractData(json)?.children?.[0]?.id || '';
        }
        const endpoint = childId ? `/api/v1/users/my-admission-trackings?childId=${encodeURIComponent(childId)}` : '/api/v1/users/my-admission-trackings';
        const res = await apiFetch(endpoint, { method: 'GET' });
        if (res.ok) {
          const json = await res.json();
          setSessions(Array.isArray(extractData(json)) ? extractData(json) : []);
        }
      } catch {} finally { setLoading(false); }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto p-8 page-enter">
        <div className="mb-8"><div className="h-8 w-52 shimmer rounded-lg mb-2" /><div className="h-4 w-72 shimmer rounded-lg" /></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-5 card-shadow border border-slate-100">
              <div className="flex justify-between mb-4"><div className="w-10 h-10 shimmer rounded-xl" /><div className="w-20 h-6 shimmer rounded-full" /></div>
              <div className="space-y-2"><div className="h-4 w-3/4 shimmer rounded" /><div className="h-4 w-1/2 shimmer rounded" /><div className="h-4 w-2/3 shimmer rounded" /></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-8 page-enter">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Physical Sessions</h1>
          <p className="text-sm text-slate-500 mt-1">
            {sessions.length > 0 ? `${sessions.length} in-person therapy appointments` : 'Your in-person therapy appointments'}
          </p>
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center card-shadow-lg border border-slate-100">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center mx-auto mb-5">
            <Activity size={36} className="text-amber-500" />
          </div>
          <p className="text-xl font-semibold text-slate-800">No physical sessions</p>
          <p className="text-sm text-slate-400 mt-2">Your in-person appointments will appear here when scheduled</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {sessions.map((s: any) => {
            const status = String(s.status || '').toUpperCase();
            const colors = STATUS_COLORS[status] || STATUS_COLORS.SCHEDULED;
            const isActive = status === 'ACTIVE' || status === 'ONGOING';
            return (
              <div key={s.id} className={`bg-white rounded-2xl p-5 card-shadow border hover-lift ${isActive ? 'border-emerald-200 ring-1 ring-emerald-100' : 'border-slate-100'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isActive ? 'bg-gradient-to-br from-amber-400 to-orange-500' : 'bg-amber-50'}`}>
                    <Activity size={18} className={isActive ? 'text-white' : 'text-amber-600'} />
                  </div>
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${colors.bg}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${colors.dot} ${isActive ? 'animate-pulse' : ''}`} />
                    <span className={`text-[10px] font-semibold uppercase ${colors.text}`}>{s.status}</span>
                  </div>
                </div>
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-sm text-slate-700">
                    <Calendar size={14} className="text-slate-400" />
                    <span className="font-medium">{formatDate(s.admissionDate)}</span>
                  </div>
                  {(s.startTime || s.endTime) && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Clock size={14} className="text-slate-400" />
                      <span>{s.startTime && s.endTime ? `${s.startTime} - ${s.endTime}` : s.startTime || s.endTime}</span>
                    </div>
                  )}
                  {s.physiotherapist?.name && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <User size={14} className="text-slate-400" />
                      <span>Dr. {s.physiotherapist.name}</span>
                    </div>
                  )}
                  {s.hospital?.name && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <MapPin size={14} className="text-slate-400" />
                      <span className="line-clamp-1">{s.hospital.name}</span>
                    </div>
                  )}
                </div>
                {s.notes && <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100 line-clamp-2 leading-relaxed">{s.notes}</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
