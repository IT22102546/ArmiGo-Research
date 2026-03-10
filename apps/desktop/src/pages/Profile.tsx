import { useEffect, useState, useCallback } from 'react';
import {
  User, Mail, Phone, Calendar, LogOut, Activity,
  Building2, Stethoscope, ClipboardList, Gamepad2, FileText,
  ChevronDown, ChevronUp, Users, Hand, Dumbbell, Heart,
  Settings, MapPin, Clock, RefreshCw, AlertCircle,
} from 'lucide-react';
import useAuthStore from '../stores/authStore';
import { apiFetch } from '../utils/api';

const extractData = (p: any) => p?.success && p?.data ? p.data : p;

const fmtDate = (d?: string | null) => {
  if (!d) return 'Not set';
  const date = new Date(d);
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
};

const calcAge = (dob?: string | null) => {
  if (!dob) return null;
  const diff = Date.now() - new Date(dob).getTime();
  const age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  return age >= 0 ? age : null;
};

const toInitials = (first?: string, last?: string) =>
  `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase() || '?';

const genderColor = (g?: string) =>
  g?.toLowerCase() === 'female' ? '#e91e8c' : '#1E90FF';

const capitalize = (s?: string) =>
  !s ? '' : s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

const resolveAvailability = (raw?: string | null): { label: string; color: string } => {
  if (raw === 'IN_WORK') return { label: 'In Work', color: '#3b82f6' };
  if (raw === 'NOT_AVAILABLE') return { label: 'Not Available', color: '#ef4444' };
  return { label: 'Available', color: '#22c55e' };
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ title, icon: Icon, count }: { title: string; icon: any; count?: number }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
        <Icon size={15} className="text-indigo-600" />
      </div>
      <span className="flex-1 text-base font-bold text-slate-900 tracking-tight">{title}</span>
      {count !== undefined && (
        <span className="min-w-[22px] h-[22px] rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center px-1.5">
          {count}
        </span>
      )}
    </div>
  );
}

function InfoRow({ icon: Icon, color, label, value, sub }: { icon: any; color: string; label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
           style={{ backgroundColor: color + '20' }}>
        <Icon size={15} style={{ color }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium mb-0.5">{label}</p>
        <p className="text-sm font-medium text-slate-900 leading-snug">{value}</p>
        {sub && <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{sub}</p>}
      </div>
    </div>
  );
}

function DetailRow({ icon: Icon, color, label, value, last }: { icon: any; color: string; label: string; value: string; last?: boolean }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3.5 ${!last ? 'border-b border-slate-50' : ''}`}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
           style={{ backgroundColor: color + '18' }}>
        <Icon size={15} style={{ color }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium mb-0.5">{label}</p>
        <p className="text-sm font-medium text-slate-900 truncate">{value}</p>
      </div>
    </div>
  );
}
function ChildCard({ child, defaultOpen }: { child: any; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const age = calcAge(child.dateOfBirth) ?? child.age;
  const gc = genderColor(child.gender);
  const physio = child.physioAssignments?.[0]?.physiotherapist ?? null;
  const availability = resolveAvailability(physio?.availabilityStatus ?? null);
  const nextUnavailable = physio?.unavailableDates?.[0];
  const playMinutes = typeof child.playTimeMinutes === 'number' ? child.playTimeMinutes : null;
  const playHours = typeof child.playHours === 'number' ? child.playHours : playMinutes !== null ? Number((playMinutes / 60).toFixed(1)) : null;

  const EXERCISES = [
    { key: 'exerciseFingers', label: 'Fingers', progKey: 'fingerProgress', color: '#6366F1', bg: '#eef2ff', icon: Hand },
    { key: 'exerciseWrist',    label: 'Wrist',   progKey: 'wristProgress',   color: '#8b5cf6', bg: '#f5f3ff', icon: Hand },
    { key: 'exerciseElbow',   label: 'Elbow',   progKey: 'elbowProgress',   color: '#f59e0b', bg: '#fffbeb', icon: Dumbbell },
    { key: 'exerciseShoulder',label: 'Shoulder',progKey: 'shoulderProgress',color: '#ec4899', bg: '#fdf2f8', icon: Heart },
  ];
  const enabledExercises = EXERCISES.filter(e => !!(child as any)[e.key]);

  return (
    <div className="bg-white rounded-2xl overflow-hidden card-shadow-lg border border-indigo-50/60 mb-3">
      {/* Gradient Header */}
      <div
        className="flex items-center gap-3 px-4 py-4"
        style={{ background: 'linear-gradient(135deg, #4B3AFF 0%, #7060FF 100%)' }}
      >
        {/* Circular Avatar */}
        <div className="w-12 h-12 rounded-full bg-white/20 border-2 border-white/50 flex items-center justify-center shrink-0">
          <span className="text-base font-bold text-white">
            {toInitials(child.firstName, child.lastName)}
          </span>
        </div>

        {/* Name + pills */}
        <div className="flex-1 min-w-0">
          <p className="text-base font-bold text-white truncate">{child.firstName} {child.lastName}</p>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            {child.displayId && (
              <span className="px-2 py-0.5 rounded-lg text-[10px] font-semibold text-white font-mono tracking-wide"
                    style={{ backgroundColor: 'rgba(255,255,255,0.25)', border: '1px solid rgba(255,255,255,0.5)' }}>
                {child.displayId}
              </span>
            )}
            <span className="px-2 py-0.5 rounded-lg text-[10px] font-semibold text-white border"
                  style={{ backgroundColor: gc + '30', borderColor: gc + '80' }}>
              {capitalize(child.gender)}
            </span>
            {age !== null && <span className="text-[12px] text-white/80">{age} yrs</span>}
          </div>
        </div>

        {/* Status + expand toggle */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border"
               style={{
                 backgroundColor: child.isActive !== false ? '#22c55e25' : '#ef444425',
                 borderColor: child.isActive !== false ? '#22c55e' : '#ef4444',
               }}>
            <div className="w-1.5 h-1.5 rounded-full"
                 style={{ backgroundColor: child.isActive !== false ? '#22c55e' : '#ef4444' }} />
            <span className="text-[10px] font-semibold"
                  style={{ color: child.isActive !== false ? '#22c55e' : '#ef4444' }}>
              {child.isActive !== false ? 'Active' : 'Inactive'}
            </span>
          </div>
          <button
            onClick={() => setOpen(!open)}
            className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 transition-colors"
          >
            {open
              ? <ChevronUp size={16} className="text-white/90" />
              : <ChevronDown size={16} className="text-white/90" />}
          </button>
        </div>
      </div>

      {/* Expandable Body */}
      {open && (
        <div className="px-4 py-3 space-y-0 divide-y divide-slate-50">
          <InfoRow icon={Building2} color="#0ea5e9" label="Hospital"
            value={child.hospital?.name ?? 'Not assigned'}
            sub={[child.hospital?.city, child.hospital?.phone].filter(Boolean).join(' · ') || undefined} />

          <InfoRow icon={Stethoscope} color="#8b5cf6" label="Physiotherapist"
            value={physio?.name ?? child.assignedDoctor ?? 'Not assigned'}
            sub={[physio?.specialization ?? physio?.role, physio ? availability.label : undefined].filter(Boolean).join(' · ') || undefined} />

          {physio && (
            <InfoRow icon={Activity} color={availability.color} label="Physio Availability"
              value={availability.label}
              sub={[
                physio.availabilityNote ? `Note: ${physio.availabilityNote}` : undefined,
                physio.availabilityUpdatedAt ? `Updated: ${fmtDate(physio.availabilityUpdatedAt)}` : undefined,
                nextUnavailable?.date ? `Next Off: ${fmtDate(nextUnavailable.date)}${nextUnavailable.reason ? ` (${nextUnavailable.reason})` : ''}` : undefined,
              ].filter(Boolean).join(' · ') || undefined} />
          )}

          <InfoRow icon={AlertCircle} color="#ef4444" label="Diagnosis"
            value={child.diagnosis ?? 'Not recorded'}
            sub={child.diagnosisDate ? `Diagnosed: ${fmtDate(child.diagnosisDate)}` : undefined} />

          <InfoRow icon={Calendar} color="#f59e0b" label="Date of Birth"
            value={fmtDate(child.dateOfBirth)} />

          <InfoRow icon={ClipboardList} color="#10b981" label="Enrolled Since"
            value={fmtDate(child.enrolledAt)} />

          <InfoRow icon={Gamepad2} color="#06b6d4" label="Play Hours"
            value={playHours !== null ? `${playHours.toFixed(1)} hrs` : 'Not recorded'}
            sub={playMinutes !== null ? `${playMinutes} minutes total` : undefined} />

          {/* Exercise Progress Bars */}
          {enabledExercises.length > 0 && (
            <div className="pt-3 pb-1">
              <p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium mb-3">Active Exercises & Progress</p>
              <div className="grid grid-cols-2 gap-3">
                {enabledExercises.map((ex) => {
                  const val = (child.progressTracker as any)?.[ex.progKey] ?? 0;
                  return (
                    <div key={ex.key} className="rounded-xl p-3 flex items-center gap-3 border border-slate-100"
                         style={{ backgroundColor: ex.bg + '60' }}>
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                           style={{ backgroundColor: ex.bg }}>
                        <ex.icon size={16} style={{ color: ex.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-700 mb-1">{ex.label}</p>
                        <div className="flex items-center gap-1.5">
                          <div className="flex-1 h-1.5 bg-white rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-500"
                                 style={{ width: `${Math.min(100, Math.max(0, val))}%`, backgroundColor: ex.color }} />
                          </div>
                          <span className="text-[11px] font-bold" style={{ color: ex.color }}>{Math.round(val)}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Medical Notes */}
          {child.medicalNotes && (
            <div className="pt-3">
              <div className="p-3 bg-slate-50 rounded-xl border-l-4 border-slate-200">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <FileText size={12} className="text-slate-400" />
                  <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wide">Medical Notes</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{child.medicalNotes}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function Profile() {
  const { currentUser, signOut } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [enrichedChildren, setEnrichedChildren] = useState<any[]>([]);

  const fetchProfile = useCallback(async () => {
    try {
      const profileRes = await apiFetch('/api/v1/users/mobile/profile', { method: 'GET' }).catch(() => null);
      if (profileRes?.ok) {
        const json = await profileRes.json();
        const payload = extractData(json);
        const parent = payload?.parent ?? payload;
        const kids = Array.isArray(payload?.children) ? payload.children : [];
        setProfileData(parent);
        if (kids.length > 0) setEnrichedChildren(kids);
      }
    } catch {}
    try {
      const childrenRes = await apiFetch('/api/v1/users/my-children', { method: 'GET' }).catch(() => null);
      if (childrenRes?.ok) {
        const json = await childrenRes.json();
        const kids = json?.success && Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : extractData(json);
        if (Array.isArray(kids) && kids.length > 0) setEnrichedChildren(kids);
      }
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleRefresh = () => { setRefreshing(true); fetchProfile(); };

  const user = profileData ?? currentUser as any;
  const profileChildren: any[] = user?.parentProfile?.children?.length
    ? user.parentProfile.children
    : user?.children ?? [];
  const children: any[] = enrichedChildren.length > 0 ? enrichedChildren : profileChildren;
  const featuredChild = children.length > 0 ? children[0] : null;

  const headerName = featuredChild
    ? `${featuredChild.firstName || ''} ${featuredChild.lastName || ''}`.trim()
    : `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'User';
  const headerInitials = toInitials(
    featuredChild ? featuredChild.firstName : user?.firstName,
    featuredChild ? featuredChild.lastName : user?.lastName,
  );

  if (loading) {
    return (
      <div className="flex-1 flex flex-col bg-slate-50">
        <div className="h-72 rounded-b-3xl shimmer" style={{ background: 'linear-gradient(135deg, #4338CA, #6366F1)' }}>
          <div className="flex items-center justify-between px-6 pt-6">
            <div className="h-6 w-28 bg-white/20 rounded-lg" />
            <div className="w-10 h-10 bg-white/20 rounded-xl" />
          </div>
          <div className="flex flex-col items-center mt-6">
            <div className="w-20 h-20 rounded-full bg-white/20 mb-3" />
            <div className="h-6 w-40 bg-white/20 rounded-lg mb-2" />
            <div className="h-5 w-28 bg-white/15 rounded-full" />
          </div>
        </div>
        <div className="flex-1 p-6 space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="bg-white rounded-2xl p-5 card-shadow border border-slate-100">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 shimmer rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-36 shimmer rounded" />
                  <div className="h-4 w-24 shimmer rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50">

      {/* ══════ IMMERSIVE GRADIENT HEADER ══════ */}
      <div
        className="relative px-6 pt-6 pb-6 overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #4338CA 0%, #6366F1 50%, #818CF8 100%)',
          borderBottomLeftRadius: '28px',
          borderBottomRightRadius: '28px',
        }}
      >
        {/* Decorative circles */}
        <div className="absolute w-44 h-44 rounded-full opacity-[0.06] bg-white" style={{ top: -40, right: -30 }} />
        <div className="absolute w-28 h-28 rounded-full opacity-[0.05] bg-white" style={{ bottom: -20, left: -20 }} />

        {/* Top bar */}
        <div className="relative z-10 flex items-center justify-between mb-5">
          <span className="text-xl font-bold text-white tracking-tight">My Profile</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className="w-10 h-10 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
            >
              <RefreshCw size={16} className={`text-white ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={signOut}
              className="w-10 h-10 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
            >
              <LogOut size={16} className="text-white" />
            </button>
          </div>
        </div>

        {/* Centered avatar + name + role pill */}
        <div className="relative z-10 flex flex-col items-center mb-5">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-3"
               style={{ backgroundColor: 'rgba(255,255,255,0.2)', border: '3px solid rgba(255,255,255,0.4)' }}>
            <span className="text-2xl font-bold text-white">{headerInitials}</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mb-2 text-center">{headerName}</h1>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full mb-2"
               style={{ backgroundColor: 'rgba(255,255,255,0.18)' }}>
            <Users size={12} className="text-white/90" />
            <span className="text-xs text-white/90 font-medium">
              {children.length > 0 ? 'Children Account' : 'Parent Account'}
            </span>
          </div>
          <p className="text-xs text-indigo-200 text-center">
            {children.length > 0
              ? `${children.length} ${children.length === 1 ? 'child' : 'children'} linked`
              : (user?.email ?? user?.phone ?? 'Parent Account')}
          </p>
        </div>

        {/* Stats ribbon */}
        <div className="relative z-10 flex rounded-2xl overflow-hidden"
             style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
          {[
            { label: children.length === 1 ? 'Child' : 'Children', value: children.length, color: '#34d399' },
            { label: 'Hospital', value: featuredChild?.hospital ? 1 : 0, color: '#fbbf24' },
            { label: 'Physio', value: featuredChild?.physioAssignments?.length ?? 0, color: '#f472b6' },
            { label: 'Play Hrs', value: featuredChild?.playHours != null ? Number(featuredChild.playHours).toFixed(1) : '0', color: '#60a5fa' },
          ].map((stat, i, arr) => (
            <div key={i}
                 className={`flex-1 py-4 text-center ${i < arr.length - 1 ? 'border-r border-white/20' : ''}`}>
              <p className="text-xl font-extrabold" style={{ color: stat.color }}>{stat.value}</p>
              <p className="text-[11px] text-indigo-200 font-medium mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ══════ SCROLL BODY ══════ */}
      <div className="px-4 pt-5 pb-12 space-y-5">

        {/* Children */}
        <div>
          <SectionHeader title="My Children" icon={Users} count={children.length} />
          {children.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center card-shadow border border-slate-100">
              <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <Users size={40} className="text-slate-300" />
              </div>
              <p className="text-base font-bold text-slate-700 mb-2">No Children Registered</p>
              <p className="text-sm text-slate-400 leading-relaxed max-w-xs mx-auto">
                Your child's therapy details will appear here once they are enrolled at a hospital by the admin.
              </p>
            </div>
          ) : (
            <div>
              {children.map((child: any, i: number) => (
                <ChildCard key={child.id} child={child} defaultOpen={i === 0} />
              ))}
            </div>
          )}
        </div>

        {/* Parent Details */}
        <div>
          <SectionHeader title="Parent Details" icon={User} />
          <div className="bg-white rounded-2xl overflow-hidden card-shadow border border-slate-100">
            {user?.email && (
              <DetailRow icon={Mail} color="#0ea5e9" label="Email" value={user.email} />
            )}
            <DetailRow icon={Phone} color="#10b981" label="Phone" value={user?.phone ?? 'Not set'} />
            {user?.dateOfBirth && (
              <DetailRow icon={Calendar} color="#f59e0b" label="Date of Birth" value={fmtDate(String(user.dateOfBirth))} />
            )}
            {(user?.city || user?.address) && (
              <DetailRow icon={MapPin} color="#ef4444" label="Location"
                value={[user.city, user.address].filter(Boolean).join(', ')} />
            )}
            <DetailRow icon={Clock} color="#8b5cf6" label="Member Since"
              value={fmtDate(user?.createdAt)} last />
          </div>
        </div>

        {/* Account */}
        <div>
          <SectionHeader title="Account" icon={Settings} />
          <div className="bg-white rounded-2xl overflow-hidden card-shadow border border-slate-100">
            <button
              onClick={signOut}
              className="w-full flex items-center gap-3 px-4 py-4 hover:bg-red-50 transition-colors group"
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                   style={{ backgroundColor: '#ef444418' }}>
                <LogOut size={15} className="text-red-500" />
              </div>
              <span className="flex-1 text-sm font-medium text-red-500 text-left">Sign Out</span>
              <ChevronDown size={16} className="text-slate-300 group-hover:text-red-300 -rotate-90 transition-colors" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

