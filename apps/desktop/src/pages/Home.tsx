import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Video, Activity, ClipboardList, Users, BookOpen, Bell,
  ChevronRight, Calendar, Clock, MapPin, User as UserIcon,
  Play, Timer, Hand, Dumbbell, TrendingUp, Heart,
} from 'lucide-react';

import useAuthStore from '../stores/authStore';
import useNotificationStore from '../stores/notificationStore';
import { apiFetch } from '../utils/api';

const extractData = (payload: any) =>
  payload?.success && payload?.data ? payload.data : payload;

const formatDateSmart = (value?: string | null) => {
  if (!value) return 'Not set';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Not set';
  const now = new Date();
  const diff = parsed.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days > 1 && days <= 7) return `In ${days} days`;
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const formatTime = (start?: string | null, end?: string | null) => {
  if (!start && !end) return '';
  if (start && end) return `${start} – ${end}`;
  return start || end || '';
};

const AVAILABILITY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  AVAILABLE: { label: 'Available', color: '#10b981', bg: '#ecfdf5' },
  IN_WORK: { label: 'In Session', color: '#f59e0b', bg: '#fffbeb' },
  NOT_AVAILABLE: { label: 'Unavailable', color: '#ef4444', bg: '#fef2f2' },
};

const EXERCISE_CONFIG = [
  { key: 'exerciseFingers', label: 'Fingers', icon: Hand, color: '#6366F1', bg: '#eef2ff' },
  { key: 'exerciseWrist', label: 'Wrist', icon: Hand, color: '#8b5cf6', bg: '#f5f3ff' },
  { key: 'exerciseElbow', label: 'Elbow', icon: Dumbbell, color: '#f59e0b', bg: '#fffbeb' },
  { key: 'exerciseShoulder', label: 'Shoulder', icon: Activity, color: '#ec4899', bg: '#fdf2f8' },
];

type ChildDetail = any;
type SessionItem = any;
type AssignmentItem = any;

export default function Home() {
  const { currentUser, signOut, isSignedIn } = useAuthStore();
  const navigate = useNavigate();
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  const [loading, setLoading] = useState(true);
  const [childName, setChildName] = useState('');
  const [childId, setChildId] = useState<string | null>(null);
  const [childDetail, setChildDetail] = useState<ChildDetail | null>(null);
  const [onlineSessions, setOnlineSessions] = useState<SessionItem[]>([]);
  const [physicalSessions, setPhysicalSessions] = useState<SessionItem[]>([]);
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const childDetailFetched = useRef(false);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  })();

  const resolveChildId = useCallback(async (): Promise<string | null> => {
    try {
      const res = await apiFetch('/api/v1/users/mobile/profile', { method: 'GET' });
      if (res.ok) {
        const json = await res.json();
        const data = extractData(json);
        const first = Array.isArray(data?.children) ? data.children[0] : null;
        if (first?.id) {
          const name = `${first.firstName || ''} ${first.lastName || ''}`.trim();
          if (name) setChildName(name);
          setChildDetail(first);
          childDetailFetched.current = true;
          return String(first.id);
        }
      }
    } catch {}
    try {
      const res = await apiFetch('/api/v1/users/my-children', { method: 'GET' });
      if (res.ok) {
        const json = await res.json();
        const rows = extractData(json) || [];
        const first = Array.isArray(rows) ? rows[0] : null;
        if (first?.id) {
          const name = `${first.firstName || ''} ${first.lastName || ''}`.trim();
          if (name) setChildName(name);
          setChildDetail(first);
          childDetailFetched.current = true;
          return String(first.id);
        }
      }
    } catch {}
    return null;
  }, []);

  const fetchData = useCallback(async () => {
    if (!isSignedIn || !currentUser) { setLoading(false); return; }
    setLoading(true);
    try {
      const cid = await resolveChildId();
      setChildId(cid);
      if (!cid) { setLoading(false); return; }

      useNotificationStore.getState().fetchUnreadCount();

      const [onlineRes, physicalRes, assignRes, childrenRes] = await Promise.all([
        apiFetch(`/api/v1/users/my-online-sessions?childId=${encodeURIComponent(cid)}`, { method: 'GET' }).catch(() => null),
        apiFetch(`/api/v1/users/my-admission-trackings?childId=${encodeURIComponent(cid)}`, { method: 'GET' }).catch(() => null),
        apiFetch(`/api/v1/users/my-assignments?childId=${encodeURIComponent(cid)}`, { method: 'GET' }).catch(() => null),
        apiFetch('/api/v1/users/my-children', { method: 'GET' }).catch(() => null),
      ]);

      if (onlineRes?.ok) {
        const json = await onlineRes.json();
        const rows = Array.isArray(extractData(json)) ? extractData(json) : [];
        setOnlineSessions(rows.filter((s: any) => s?.child?.id === cid));
      }
      if (physicalRes?.ok) {
        const json = await physicalRes.json();
        const rows = Array.isArray(extractData(json)) ? extractData(json) : [];
        setPhysicalSessions(rows.filter((s: any) => s?.child?.id === cid));
      }
      if (assignRes?.ok) {
        const json = await assignRes.json();
        const root = extractData(json);
        let items: any[] = [];
        if (Array.isArray(root)) items = root;
        else if (Array.isArray(root?.assignments)) items = root.assignments;
        else if (Array.isArray(root?.data?.assignments)) items = root.data.assignments;
        setAssignments(items);
      }
      if (childrenRes?.ok) {
        try {
          const json = await childrenRes.json();
          const rows = extractData(json) || [];
          const match = Array.isArray(rows) ? rows.find((c: any) => c.id === cid) || rows[0] : null;
          if (match) { setChildDetail(match); childDetailFetched.current = true; }
        } catch {}
      }
    } catch {} finally { setLoading(false); }
  }, [currentUser, isSignedIn, resolveChildId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Derived data 
  const scheduledOnline = onlineSessions.filter((s: any) => {
    const st = String(s.status || '').toUpperCase();
    return st === 'SCHEDULED' || st === 'ONGOING';
  });
  const scheduledPhysical = physicalSessions.filter((s: any) => {
    const st = String(s.status || '').toUpperCase();
    return st === 'SCHEDULED' || st === 'ONGOING' || st === 'ACTIVE';
  });
  const activeAssignments = assignments.filter((a: any) => String(a.status || '').toUpperCase() === 'ACTIVE');

  const displayName = childName || `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim() || 'User';
  const initials = (childName ? childName.split(' ').map((w: string) => w[0]).join('').slice(0, 2) : '') 
    || `${currentUser?.firstName?.[0] || ''}${currentUser?.lastName?.[0] || ''}` || 'U';

  const physio = childDetail?.physioAssignments?.[0]?.physiotherapist || null;
  const assignedDoctorFallback = !physio && childDetail?.assignedDoctor ? childDetail.assignedDoctor as string : null;
  const availConfig = physio?.availabilityStatus ? AVAILABILITY_CONFIG[physio.availabilityStatus] : null;
  const enabledExercises = EXERCISE_CONFIG.filter((e) => !!(childDetail as any)?.[e.key]);

  const quickAccess = [
    { icon: Video, label: 'Online Sessions', color: '#6366F1', bg: '#eef2ff', path: '/online-sessions' },
    { icon: Activity, label: 'Physical Sessions', color: '#f59e0b', bg: '#fffbeb', path: '/physical-sessions' },
    { icon: ClipboardList, label: 'Assignments', color: '#10b981', bg: '#ecfdf5', path: '/assignments' },
    { icon: Users, label: 'Physiotherapists', color: '#ec4899', bg: '#fdf2f8', path: '/physiotherapists' },
    { icon: BookOpen, label: 'Publications', color: '#8b5cf6', bg: '#f5f3ff', path: '/publications' },
    { icon: Bell, label: 'Notifications', color: '#ef4444', bg: '#fef2f2', path: '/notifications' },
  ];

  const [progressModalOpen, setProgressModalOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto p-8 page-enter">
        <div className="rounded-2xl overflow-hidden mb-8"><div className="h-56 shimmer" /></div>
        <div className="grid grid-cols-6 gap-4 mb-8">{[1,2,3,4,5,6].map(i => <div key={i} className="h-24 shimmer rounded-2xl" />)}</div>
        <div className="grid grid-cols-2 gap-6">{[1,2].map(i => <div key={i} className="h-48 shimmer rounded-2xl" />)}</div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto page-enter">
      {/* Hero Header */}
      <div className="rounded-2xl mx-8 mt-8 p-8 relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(255,255,255,0.1),transparent)]" />
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/[0.04] -mr-24 -mt-24" />
        <div className="absolute bottom-0 left-1/3 w-40 h-40 rounded-full bg-white/[0.04] -mb-16" />
        
        <div className="relative z-10 flex items-start justify-between">
          <div className="flex-1">
            <p className="text-white/60 text-sm font-medium mb-1">{greeting}</p>
            <h1 className="text-3xl font-bold text-white tracking-tight mb-1">{displayName}</h1>
            {childDetail?.displayId && (
              <span className="inline-flex items-center rounded-md bg-white/15 backdrop-blur-sm px-2.5 py-1 text-xs font-semibold text-white/90 font-mono tracking-wide mb-4">
                {childDetail.displayId}
              </span>
            )}

            {/* Stats */}
            <div className="flex gap-4">
              {[
                { label: 'Online', value: scheduledOnline.length, color: 'from-emerald-400 to-emerald-500' },
                { label: 'Physical', value: scheduledPhysical.length, color: 'from-amber-400 to-amber-500' },
                { label: 'Tasks', value: activeAssignments.length, color: 'from-pink-400 to-pink-500' },
              ].map((s, i) => (
                <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl px-5 py-3 text-center min-w-[80px]">
                  <p className={`text-2xl font-bold bg-gradient-to-r ${s.color} bg-clip-text text-transparent`}>{s.value}</p>
                  <p className="text-[11px] text-white/50 font-medium mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Avatar */}
          <div className="w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-sm border border-white/20 shadow-lg">
            <span className="text-white text-xl font-bold">{initials}</span>
          </div>
        </div>

        {/* Progress bar */}
        {enabledExercises.length > 0 && (
          <div className="mt-6 bg-white/[0.08] backdrop-blur-sm rounded-xl p-4 border border-white/[0.06]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp size={14} className="text-white/60" />
                <span className="text-sm font-semibold text-white/80">Overall Progress</span>
              </div>
              <span className="text-sm font-bold text-emerald-400">
                {Math.round(childDetail?.progressTracker?.currentProgress ?? 0)}%
              </span>
             
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-300 rounded-full transition-all duration-500"
                   style={{ width: `${Math.min(100, Math.max(0, childDetail?.progressTracker?.currentProgress ?? 0))}%` }} />
            </div>
            <div className="grid grid-cols-4 gap-3 mt-4">
              {enabledExercises.map((ex) => {
                const progKey = ex.key === 'exerciseFingers' ? 'fingerProgress'
                  : ex.key === 'exerciseWrist' ? 'wristProgress'
                  : ex.key === 'exerciseElbow' ? 'elbowProgress' : 'shoulderProgress';
                const val = childDetail?.progressTracker?.[progKey] ?? 0;
                return (
                  <div key={ex.key} className="text-center">
                    <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center mx-auto mb-1.5">
                      <ex.icon size={15} style={{ color: ex.color }} />
                    </div>
                    <p className="text-[11px] text-white/50">{ex.label}</p>
                    <p className="text-xs font-bold text-white">{Math.round(val)}%</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Quick Access Grid */}
      <div className="px-8 mt-8">
        <h2 className="text-lg font-bold text-slate-900 tracking-tight mb-1">Quick Access</h2>
        <p className="text-sm text-slate-500 mb-4">Navigate to your tools</p>
        <div className="grid grid-cols-6 gap-4">
          {quickAccess.map((item, idx) => (
            <button
              key={idx}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center gap-3 p-4 bg-white rounded-2xl card-shadow border border-slate-100 hover-lift group"
            >
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110"
                   style={{ backgroundColor: item.bg }}>
                <item.icon size={26} style={{ color: item.color }} />
              </div>
              <span className="text-xs font-medium text-slate-600 text-center leading-tight">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Sessions & Assignments Grid */}
      <div className="px-8 mt-8 grid grid-cols-2 gap-6">
        {/* Online Sessions */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">Online Sessions</h3>
              <p className="text-xs text-slate-500">Upcoming virtual appointments</p>
            </div>
            <button onClick={() => navigate('/online-sessions')} className="text-xs text-indigo-600 font-semibold flex items-center gap-1 bg-indigo-50 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition-colors">
              See All <ChevronRight size={12} />
            </button>
          </div>
          {scheduledOnline.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center card-shadow border border-slate-100">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center mx-auto mb-3">
                <Video size={24} className="text-indigo-500" />
              </div>
              <p className="text-sm font-semibold text-slate-700">No upcoming sessions</p>
              <p className="text-xs text-slate-400 mt-1">Your scheduled sessions will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {scheduledOnline.slice(0, 3).map((s: any) => (
                <div key={s.id} className="rounded-2xl p-4 text-white card-shadow-lg bg-gradient-to-br from-indigo-500 to-purple-600">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
                      <Video size={14} />
                    </div>
                    <span className="text-[10px] uppercase font-semibold bg-white/15 px-2.5 py-1 rounded-full">{s.status}</span>
                  </div>
                  <p className="text-sm opacity-80">{formatDateSmart(s.admissionDate)}</p>
                  <p className="text-lg font-bold tracking-tight">{formatTime(s.startTime, s.endTime) || 'Time TBD'}</p>
                  {s.physiotherapist?.name && (
                    <div className="flex items-center gap-1.5 mt-2 text-sm opacity-70">
                      <UserIcon size={12} />
                      <span>Dr. {s.physiotherapist.name}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Physical Sessions */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">Physical Sessions</h3>
              <p className="text-xs text-slate-500">In-person appointments</p>
            </div>
            <button onClick={() => navigate('/physical-sessions')} className="text-xs text-amber-600 font-semibold flex items-center gap-1 bg-amber-50 px-3 py-1.5 rounded-full hover:bg-amber-100 transition-colors">
              See All <ChevronRight size={12} />
            </button>
          </div>
          {scheduledPhysical.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center card-shadow border border-slate-100">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center mx-auto mb-3">
                <Activity size={24} className="text-amber-500" />
              </div>
              <p className="text-sm font-semibold text-slate-700">No physical sessions</p>
              <p className="text-xs text-slate-400 mt-1">Your appointments will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {scheduledPhysical.slice(0, 3).map((s: any) => (
                <div key={s.id} className="rounded-2xl p-4 text-white card-shadow-lg bg-gradient-to-br from-amber-400 to-orange-500">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
                      <Activity size={14} />
                    </div>
                    <span className="text-[10px] uppercase font-semibold bg-white/15 px-2.5 py-1 rounded-full">{s.status}</span>
                  </div>
                  <p className="text-sm opacity-80">{formatDateSmart(s.admissionDate)}</p>
                  <p className="text-lg font-bold tracking-tight">{formatTime(s.startTime, s.endTime) || 'Time TBD'}</p>
                  {s.physiotherapist?.name && (
                    <div className="flex items-center gap-1.5 mt-2 text-sm opacity-70">
                      <UserIcon size={12} />
                      <span>Dr. {s.physiotherapist.name}</span>
                    </div>
                  )}
                  {s.hospital?.name && (
                    <div className="flex items-center gap-1.5 mt-1 text-xs opacity-60">
                      <MapPin size={10} />
                      <span>{s.hospital.name}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Assignments Section */}
      <div className="px-8 mt-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">Assignments</h3>
            <p className="text-xs text-slate-500">Tasks waiting for your attention</p>
          </div>
          <button onClick={() => navigate('/assignments')} className="text-xs text-emerald-600 font-semibold flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-full hover:bg-emerald-100 transition-colors">
            See All <ChevronRight size={12} />
          </button>
        </div>
        {assignments.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center card-shadow border border-slate-100">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-50 to-green-50 flex items-center justify-center mx-auto mb-3">
              <ClipboardList size={24} className="text-emerald-500" />
            </div>
            <p className="text-sm font-semibold text-slate-700">No assignments</p>
            <p className="text-xs text-slate-400 mt-1">Your tasks will be displayed here</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {assignments.slice(0, 6).map((a: any, index: number) => {
              const isActive = String(a.status || '').toUpperCase() === 'ACTIVE';
              return (
                <div key={a.id} className={`bg-white rounded-2xl p-4 card-shadow border hover-lift ${index === 0 ? 'border-indigo-200 ring-1 ring-indigo-50' : 'border-slate-100'}`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isActive ? 'bg-emerald-50' : 'bg-red-50'}`}>
                      <Play size={16} className={isActive ? 'text-emerald-500' : 'text-red-500'} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900 truncate">{a.title}</p>
                      {a.description && <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">{a.description}</p>}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Calendar size={11} />
                      <span className="text-[11px]">{formatDateSmart(a.dueDate)}</span>
                    </div>
                    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${isActive ? 'bg-emerald-50' : 'bg-red-50'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-red-400'}`} />
                      <span className={`text-[10px] font-semibold uppercase ${isActive ? 'text-emerald-600' : 'text-red-600'}`}>{a.status}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Row - Physio & Exercises */}
      <div className="px-8 mt-8 pb-8 grid grid-cols-2 gap-6">
        {/* Physiotherapist Card */}
        {(physio || assignedDoctorFallback) && (
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight mb-1">Your Physiotherapist</h3>
            <p className="text-xs text-slate-500 mb-4">Primary care provider</p>
            <div className="bg-white rounded-2xl p-6 card-shadow border border-slate-100 hover-lift">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-200">
                  <span className="text-xl font-bold text-white">{(physio?.name || assignedDoctorFallback || 'P')[0]?.toUpperCase()}</span>
                </div>
                <div>
                  <p className="text-base font-bold text-slate-900 tracking-tight">{physio?.name || assignedDoctorFallback || 'Physiotherapist'}</p>
                  {physio?.specialization && <p className="text-sm text-slate-500">{physio.specialization}</p>}
                  {!physio && assignedDoctorFallback && (
                    <p className="text-xs text-amber-500 mt-0.5 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                      Assigned via name only
                    </p>
                  )}
                </div>
              </div>
              {availConfig && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-3" style={{ backgroundColor: availConfig.bg }}>
                  <div className={`w-2 h-2 rounded-full ${availConfig.label === 'Available' ? 'animate-pulse' : ''}`} style={{ backgroundColor: availConfig.color }} />
                  <span className="text-xs font-semibold" style={{ color: availConfig.color }}>{availConfig.label}</span>
                </div>
              )}
              {physio?.phone && (
                <p className="text-sm text-slate-600 flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center"><Clock size={13} className="text-slate-400" /></div>
                  {physio.phone}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Active Exercises */}
        {enabledExercises.length > 0 && (
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight mb-1">Active Exercises</h3>
            <p className="text-xs text-slate-500 mb-4">Your personalized routine</p>
            <div className="grid grid-cols-2 gap-3">
              {enabledExercises.map((ex) => {
                const progKey = ex.key === 'exerciseFingers' ? 'fingerProgress'
                  : ex.key === 'exerciseWrist' ? 'wristProgress'
                  : ex.key === 'exerciseElbow' ? 'elbowProgress' : 'shoulderProgress';
                const val = childDetail?.progressTracker?.[progKey] ?? 0;
                return (
                  <div key={ex.key} className="bg-white rounded-2xl p-5 card-shadow border border-slate-100 text-center hover-lift">
                    <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: ex.bg }}>
                      <ex.icon size={26} style={{ color: ex.color }} />
                    </div>
                    <p className="text-sm font-semibold text-slate-900 mb-2">{ex.label}</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, val)}%`, backgroundColor: ex.color }} />
                      </div>
                      <span className="text-xs font-bold text-slate-600">{Math.round(val)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
            {(childDetail?.playTimeMinutes ?? 0) > 0 && (
              <div className="mt-3 bg-indigo-50 rounded-xl p-4 flex items-center gap-3 border border-indigo-100">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                  <Timer size={18} className="text-indigo-600" />
                </div>
                <div>
                  <p className="text-xs text-indigo-500 font-medium">Total Practice Time</p>
                  <p className="text-sm font-bold text-slate-900">{childDetail?.playHours ?? 0}h ({childDetail?.playTimeMinutes ?? 0} min)</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
