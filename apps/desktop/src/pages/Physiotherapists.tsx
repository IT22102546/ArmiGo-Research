import { useEffect, useState } from 'react';
import { Users, Phone, Mail, CheckCircle, Clock, XCircle, Calendar, Stethoscope, Activity, AlertCircle } from 'lucide-react';
import { apiFetch } from '../utils/api';

const extractData = (p: any) => p?.success && p?.data ? p.data : p;

const AVAIL: Record<string, { label: string; icon: any; color: string; bg: string; dot: string }> = {
  AVAILABLE: { label: 'Available', icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', dot: 'bg-emerald-500' },
  IN_WORK: { label: 'In Session', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', dot: 'bg-amber-500' },
  NOT_AVAILABLE: { label: 'Unavailable', icon: XCircle, color: 'text-red-500', bg: 'bg-red-50', dot: 'bg-red-400' },
};

export default function Physiotherapists() {
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch('/api/v1/users/my-children', { method: 'GET' });
        if (res.ok) {
          const json = await res.json();
          setChildren(Array.isArray(extractData(json)) ? extractData(json) : []);
        }
      } catch {} finally { setLoading(false); }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto p-8 page-enter">
        <div className="mb-8"><div className="h-8 w-48 shimmer rounded-lg mb-2" /><div className="h-4 w-56 shimmer rounded-lg" /></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-6 card-shadow border border-slate-100">
              <div className="flex items-center gap-4 mb-4"><div className="w-14 h-14 shimmer rounded-2xl" /><div className="flex-1 space-y-2"><div className="h-5 w-40 shimmer rounded" /><div className="h-4 w-28 shimmer rounded" /></div></div>
              <div className="space-y-2"><div className="h-4 w-2/3 shimmer rounded" /><div className="h-4 w-1/2 shimmer rounded" /></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Build physio cards from children — use physioAssignments when available, fall back to assignedDoctor name
  const physios = children.flatMap((child: any) => {
    const childName = `${child.firstName || ''} ${child.lastName || ''}`.trim();
    const assignments = child.physioAssignments || [];
    if (assignments.length > 0 && assignments[0]?.physiotherapist) {
      return assignments.map((pa: any) => ({
        ...pa.physiotherapist,
        childName,
        hasFullData: true,
      }));
    }
    if (child.assignedDoctor) {
      return [{ name: child.assignedDoctor, childName, hasFullData: false }];
    }
    return [];
  });

  return (
    <div className="flex-1 overflow-y-auto p-8 page-enter">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Physiotherapists</h1>
          <p className="text-sm text-slate-500 mt-1">
            {physios.length > 0 ? `${physios.length} assigned care providers` : 'Your assigned care providers'}
          </p>
        </div>
      </div>

      {physios.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center card-shadow-lg border border-slate-100">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-pink-50 to-rose-50 flex items-center justify-center mx-auto mb-5">
            <Stethoscope size={36} className="text-pink-500" />
          </div>
          <p className="text-xl font-semibold text-slate-800">No physiotherapists assigned</p>
          <p className="text-sm text-slate-400 mt-2">Your care providers will appear here when assigned</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {physios.map((p: any, i: number) => {
            const avail = p.availabilityStatus ? AVAIL[p.availabilityStatus] : null;
            const AvailIcon = avail?.icon || CheckCircle;
            const isAvailable = p.availabilityStatus === 'AVAILABLE';
            const isNotAvailable = p.availabilityStatus === 'NOT_AVAILABLE';
            return (
              <div key={i} className={`bg-white rounded-2xl p-6 card-shadow border hover-lift ${isNotAvailable ? 'border-red-100' : isAvailable ? 'border-emerald-100' : 'border-slate-100'}`}>
                {/* Header with avatar, name, status */}
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-md shadow-indigo-200">
                    <span className="text-xl font-bold text-white">{(p.name || 'P')[0]?.toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-bold text-slate-900 tracking-tight">{p.name || 'Physiotherapist'}</p>
                    {p.specialization && <p className="text-sm text-slate-500 mt-0.5">{p.specialization}</p>}
                    <div className="flex items-center gap-1.5 mt-1">
                      <Users size={12} className="text-slate-400" />
                      <p className="text-xs text-slate-400">Patient: {p.childName}</p>
                    </div>
                  </div>
                  {avail ? (
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full shrink-0 ${avail.bg}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${avail.dot} ${isAvailable ? 'animate-pulse' : ''}`} />
                      <span className={`text-xs font-semibold ${avail.color}`}>{avail.label}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full shrink-0 bg-indigo-50">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                      <span className="text-xs font-semibold text-indigo-600">Assigned</span>
                    </div>
                  )}
                </div>

                {/* Availability Details Section */}
                {p.hasFullData && (
                  <div className="mb-4 p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                    <div className="flex items-center gap-2 mb-1">
                      <Activity size={13} className="text-indigo-500" />
                      <span className="text-xs font-semibold text-slate-600">Availability</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {avail ? (
                        <>
                          <div className={`w-2 h-2 rounded-full ${avail.dot} ${isAvailable ? 'animate-pulse' : ''}`} />
                          <span className={`text-xs font-semibold ${avail.color}`}>{avail.label}</span>
                        </>
                      ) : (
                        <>
                          <div className="w-2 h-2 rounded-full bg-slate-300" />
                          <span className="text-xs text-slate-400">Not set</span>
                        </>
                      )}
                    </div>
                    {p.availabilityNote && (
                      <div className="flex items-start gap-2 text-sm">
                        <div className="w-6 h-6 rounded-md bg-amber-50 flex items-center justify-center shrink-0 mt-0.5"><AlertCircle size={12} className="text-amber-500" /></div>
                        <span className="text-xs text-slate-500">{p.availabilityNote}</span>
                      </div>
                    )}
                    {p.availabilityUpdatedAt && (
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-6 h-6 rounded-md bg-blue-50 flex items-center justify-center shrink-0"><Clock size={12} className="text-blue-500" /></div>
                        <span className="text-xs text-slate-400">Updated: {new Date(p.availabilityUpdatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Contact Info */}
                <div className="space-y-2.5 pl-1">
                  {p.phone && (
                    <div className="flex items-center gap-2.5 text-sm text-slate-600">
                      <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center"><Phone size={13} className="text-slate-400" /></div>
                      <span>{p.phone}</span>
                    </div>
                  )}
                  {p.email && (
                    <div className="flex items-center gap-2.5 text-sm text-slate-600">
                      <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center"><Mail size={13} className="text-slate-400" /></div>
                      <span className="truncate">{p.email}</span>
                    </div>
                  )}
                </div>

                {/* Unavailable Dates */}
                {p.unavailableDates?.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="text-xs font-semibold text-slate-500 mb-2.5">Unavailable Dates</p>
                    <div className="flex flex-wrap gap-2">
                      {p.unavailableDates.slice(0, 4).map((ud: any) => (
                        <div key={ud.id} className="flex items-center gap-1.5 bg-red-50 px-2.5 py-1.5 rounded-lg">
                          <Calendar size={11} className="text-red-400" />
                          <span className="text-[11px] text-red-600 font-medium">
                            {new Date(ud.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            {ud.reason ? ` — ${ud.reason}` : ''}
                          </span>
                        </div>
                      ))}
                      {p.unavailableDates.length > 4 && (
                        <span className="text-[11px] text-slate-400 font-medium px-2 py-1.5">+{p.unavailableDates.length - 4} more</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
