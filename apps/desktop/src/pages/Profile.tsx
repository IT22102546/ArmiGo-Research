import { useEffect, useState } from 'react';
import {
  User, Mail, Phone, Calendar, Shield, LogOut, Heart, Hand, Activity,
  Building2, Stethoscope, ClipboardList, GamepadIcon, FileText,
  ChevronDown, ChevronUp, Users, Dumbbell,
} from 'lucide-react';
import useAuthStore from '../stores/authStore';
import { apiFetch } from '../utils/api';

const extractData = (p: any) => p?.success && p?.data ? p.data : p;

const EXERCISE_TAGS: Record<string, { label: string; icon: any; bg: string; text: string }> = {
  exerciseFingers: { label: 'Fingers', icon: Hand, bg: 'bg-indigo-50', text: 'text-indigo-600' },
  exerciseWrist: { label: 'Wrist', icon: Activity, bg: 'bg-purple-50', text: 'text-purple-600' },
  exerciseElbow: { label: 'Elbow', icon: Dumbbell, bg: 'bg-amber-50', text: 'text-amber-600' },
  exerciseShoulder: { label: 'Shoulder', icon: Heart, bg: 'bg-pink-50', text: 'text-pink-600' },
};

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

function InfoRow({ icon: Icon, color, label, value, sub }: { icon: any; color: string; label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-50 last:border-0">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: color + '15' }}>
        <Icon size={16} style={{ color }} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-400 font-medium">{label}</p>
        <p className="text-sm font-semibold text-slate-800 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function ChildCard({ child, defaultOpen }: { child: any; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const age = calcAge(child.dateOfBirth) ?? child.age;
  const physio = child.physioAssignments?.[0]?.physiotherapist ?? null;
  const availability = physio?.availabilityStatus === 'IN_WORK'
    ? { label: 'In Work', color: '#3b82f6' }
    : physio?.availabilityStatus === 'NOT_AVAILABLE'
    ? { label: 'Not Available', color: '#ef4444' }
    : { label: 'Available', color: '#22c55e' };
  const nextUnavailable = physio?.unavailableDates?.[0];
  const playMinutes = typeof child.playTimeMinutes === 'number' ? child.playTimeMinutes : null;
  const playHours = typeof child.playHours === 'number' ? child.playHours : playMinutes !== null ? Number((playMinutes / 60).toFixed(1)) : null;

  return (
    <div className="bg-white rounded-2xl card-shadow border border-slate-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-4 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-white/20 border-2 border-white/40 flex items-center justify-center">
          <span className="text-lg font-bold text-white">
            {(child.firstName?.[0] || 'C').toUpperCase()}{(child.lastName?.[0] || '').toUpperCase()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-bold text-white">{child.firstName} {child.lastName}</p>
          <div className="flex items-center gap-2 mt-1">
            {child.displayId && (
              <span className="px-2 py-0.5 rounded-md bg-white/20 text-[10px] font-semibold text-white font-mono tracking-wide">
                {child.displayId}
              </span>
            )}
            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold text-white" style={{ backgroundColor: child.gender?.toLowerCase() === 'female' ? 'rgba(233,30,140,0.35)' : 'rgba(30,144,255,0.35)' }}>
              {child.gender || 'N/A'}
            </span>
            <span className="text-[11px] text-white/70">{age} yrs</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${child.isActive !== false ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300' : 'bg-red-500/20 border-red-400 text-red-300'}`}>
            {child.isActive !== false ? 'Active' : 'Inactive'}
          </span>
          <button onClick={() => setOpen(!open)} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
            {open ? <ChevronUp size={16} className="text-white/80" /> : <ChevronDown size={16} className="text-white/80" />}
          </button>
        </div>
      </div>

      {/* Expandable body */}
      {open && (
        <div className="px-5 py-4 space-y-0">
          <InfoRow icon={Building2} color="#0ea5e9" label="Hospital" value={child.hospital?.name ?? 'Not assigned'} sub={[child.hospital?.city, child.hospital?.phone].filter(Boolean).join(' · ') || undefined} />
          <InfoRow icon={Stethoscope} color="#8b5cf6" label="Physiotherapist" value={physio?.name ?? child.assignedDoctor ?? 'Not assigned'} sub={[physio?.specialization ?? physio?.role, physio ? availability.label : undefined].filter(Boolean).join(' · ') || undefined} />
          {physio && (
            <InfoRow icon={Activity} color={availability.color} label="Physio Availability" value={availability.label} sub={[physio.availabilityNote ? `Note: ${physio.availabilityNote}` : undefined, physio.availabilityUpdatedAt ? `Updated: ${fmtDate(physio.availabilityUpdatedAt)}` : undefined, nextUnavailable?.date ? `Next Off: ${fmtDate(nextUnavailable.date)}${nextUnavailable.reason ? ` (${nextUnavailable.reason})` : ''}` : undefined].filter(Boolean).join(' · ') || undefined} />
          )}
          <InfoRow icon={FileText} color="#ef4444" label="Diagnosis" value={child.diagnosis ?? 'Not recorded'} sub={child.diagnosisDate ? `Diagnosed: ${fmtDate(child.diagnosisDate)}` : undefined} />
          <InfoRow icon={Calendar} color="#f59e0b" label="Date of Birth" value={fmtDate(child.dateOfBirth)} />
          <InfoRow icon={ClipboardList} color="#10b981" label="Enrolled Since" value={fmtDate(child.enrolledAt)} />
          <InfoRow icon={GamepadIcon} color="#06b6d4" label="Play Hours" value={playHours !== null ? `${playHours.toFixed(1)} hrs` : 'Not recorded'} sub={playMinutes !== null ? `${playMinutes} minutes total` : undefined} />

          {/* Exercise tags */}
          {Object.entries(EXERCISE_TAGS).some(([key]) => child[key]) && (
            <div className="pt-3">
              <p className="text-xs text-slate-400 font-medium mb-2">Exercises</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(EXERCISE_TAGS).map(([key, tag]) =>
                  child[key] ? (
                    <div key={key} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${tag.bg}`}>
                      <tag.icon size={12} className={tag.text} />
                      <span className={`text-[11px] font-semibold ${tag.text}`}>{tag.label}</span>
                    </div>
                  ) : null
                )}
              </div>
            </div>
          )}

          {/* Medical notes */}
          {child.medicalNotes && (
            <div className="mt-3 p-3 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-1.5 mb-1.5">
                <FileText size={12} className="text-slate-400" />
                <span className="text-xs text-slate-500 font-medium">Medical Notes</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{child.medicalNotes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Profile() {
  const { currentUser, signOut } = useAuthStore();
  const [profileData, setProfileData] = useState<any>(null);
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // 1. Fetch mobile profile (returns { parent, children })
        const profileRes = await apiFetch('/api/v1/users/mobile/profile', { method: 'GET' }).catch(() => null);
        if (profileRes?.ok) {
          const json = await profileRes.json();
          const payload = extractData(json);
          const parent = payload?.parent ?? payload;
          const kids = Array.isArray(payload?.children) ? payload.children : [];
          setProfileData(parent);
          if (kids.length > 0) setChildren(kids);
        }

        // 2. Fetch my-children (richer data with progress) — overwrites if available
        const childrenRes = await apiFetch('/api/v1/users/my-children', { method: 'GET' }).catch(() => null);
        if (childrenRes?.ok) {
          const json = await childrenRes.json();
          const kids = extractData(json);
          if (Array.isArray(kids) && kids.length > 0) setChildren(kids);
        }
      } catch {} finally { setLoading(false); }
    })();
  }, []);

  // Merge children sources: prefer fetched children, fallback to profile-embedded
  const user = profileData ?? currentUser;
  const profileChildren: any[] =
    user?.parentProfile?.children?.length
      ? user.parentProfile.children
      : user?.children ?? [];
  const resolvedChildren = children.length > 0 ? children : profileChildren;

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto p-8 page-enter">
        <div className="bg-white rounded-2xl card-shadow-lg border border-slate-100 overflow-hidden mb-6">
          <div className="h-36 shimmer" />
          <div className="px-8 pt-16 pb-6 space-y-3"><div className="h-7 w-48 shimmer rounded-lg" /><div className="h-4 w-24 shimmer rounded" /><div className="flex gap-4 mt-4"><div className="h-4 w-36 shimmer rounded" /><div className="h-4 w-32 shimmer rounded" /></div></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {[1, 2].map((i) => (<div key={i} className="bg-white rounded-2xl p-6 card-shadow border border-slate-100"><div className="flex items-center gap-4"><div className="w-12 h-12 shimmer rounded-xl" /><div className="space-y-2"><div className="h-5 w-32 shimmer rounded" /><div className="h-4 w-24 shimmer rounded" /></div></div></div>))}
        </div>
      </div>
    );
  }

  const featuredChild = resolvedChildren.length > 0 ? resolvedChildren[0] : null;
  const headerName = featuredChild
    ? `${featuredChild.firstName || ''} ${featuredChild.lastName || ''}`.trim()
    : `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim() || 'User';
  const headerInitials = headerName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() || 'U';

  return (
    <div className="flex-1 overflow-y-auto p-8 page-enter">
      {/* Profile Header — Child-focused (like mobile) */}
      <div className="bg-white rounded-2xl card-shadow-lg border border-slate-100 overflow-hidden mb-6">
        <div className="h-44 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.12),transparent)]" />
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/[0.04] -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-1/3 w-32 h-32 rounded-full bg-white/[0.04] -mb-12" />

          {/* Sign Out */}
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={signOut}
              className="flex items-center gap-2 px-4 py-2 bg-white/15 backdrop-blur-sm text-white rounded-xl text-sm font-medium hover:bg-white/25 transition-colors"
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </div>

          {/* Avatar + Name + Stats */}
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pt-4">
            <div className="w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-sm border border-white/20 shadow-lg mb-3">
              <span className="text-white text-xl font-bold">{headerInitials}</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">{headerName}</h1>
            <div className="flex items-center gap-1.5 mt-1.5">
              <Users size={12} className="text-white/60" />
              <span className="text-xs text-white/70 font-medium">
                {resolvedChildren.length > 0 ? `${resolvedChildren.length} ${resolvedChildren.length === 1 ? 'child' : 'children'} linked` : 'Parent Account'}
              </span>
            </div>
          </div>
        </div>

        {/* Stats ribbon */}
        <div className="flex divide-x divide-slate-100">
          {[
            { label: 'Children', value: resolvedChildren.length, color: 'text-emerald-500' },
            { label: 'Hospital', value: featuredChild?.hospital ? 1 : 0, color: 'text-amber-500' },
            { label: 'Physio', value: featuredChild?.physioAssignments?.length ?? 0, color: 'text-pink-500' },
            { label: 'Play Hrs', value: featuredChild?.playHours?.toFixed(1) ?? '0', color: 'text-blue-500' },
          ].map((stat, i) => (
            <div key={i} className="flex-1 py-4 text-center">
              <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Children — Primary Focus */}
      {resolvedChildren.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
              <Users size={15} className="text-indigo-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">My Children</h2>
            <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold">{resolvedChildren.length}</span>
          </div>
          <div className="space-y-4">
            {resolvedChildren.map((child: any, i: number) => (
              <ChildCard key={child.id} child={child} defaultOpen={i === 0} />
            ))}
          </div>
        </div>
      )}

      {resolvedChildren.length === 0 && (
        <div className="bg-white rounded-2xl p-8 card-shadow border border-slate-100 mb-6 text-center">
          <Users size={48} className="text-slate-200 mx-auto mb-3" />
          <p className="text-base font-semibold text-slate-700">No Children Registered</p>
          <p className="text-sm text-slate-400 mt-1">Your child's therapy details will appear here once they are enrolled at a hospital by the admin.</p>
        </div>
      )}

      {/* Parent Details — Secondary */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
            <User size={15} className="text-slate-500" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Parent Details</h2>
        </div>
        <div className="bg-white rounded-2xl p-5 card-shadow border border-slate-100">
          {currentUser?.email && (
            <InfoRow icon={Mail} color="#0ea5e9" label="Email" value={currentUser.email} />
          )}
          <InfoRow icon={Phone} color="#10b981" label="Phone" value={currentUser?.phone ?? 'Not set'} />
          {currentUser?.dateOfBirth && (
            <InfoRow icon={Calendar} color="#f59e0b" label="Date of Birth" value={fmtDate(String(currentUser.dateOfBirth))} />
          )}
        </div>
      </div>
    </div>
  );
}
