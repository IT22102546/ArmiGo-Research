import { useEffect, useState } from 'react';
import { User, Mail, Phone, Calendar, Shield, LogOut, Heart, Hand, Activity } from 'lucide-react';
import useAuthStore from '../stores/authStore';
import { apiFetch } from '../utils/api';

const extractData = (p: any) => p?.success && p?.data ? p.data : p;

const EXERCISE_TAGS: Record<string, { label: string; icon: any; bg: string; text: string }> = {
  exerciseFingers: { label: 'Fingers', icon: Hand, bg: 'bg-indigo-50', text: 'text-indigo-600' },
  exerciseWrist: { label: 'Wrist', icon: Activity, bg: 'bg-purple-50', text: 'text-purple-600' },
  exerciseElbow: { label: 'Elbow', icon: Activity, bg: 'bg-amber-50', text: 'text-amber-600' },
  exerciseShoulder: { label: 'Shoulder', icon: Heart, bg: 'bg-pink-50', text: 'text-pink-600' },
};

export default function Profile() {
  const { currentUser, signOut } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [profileRes, childrenRes] = await Promise.all([
          apiFetch('/api/v1/users/mobile/profile', { method: 'GET' }).catch(() => null),
          apiFetch('/api/v1/users/my-children', { method: 'GET' }).catch(() => null),
        ]);
        if (profileRes?.ok) {
          const json = await profileRes.json();
          setProfile(extractData(json));
        }
        if (childrenRes?.ok) {
          const json = await childrenRes.json();
          setChildren(Array.isArray(extractData(json)) ? extractData(json) : []);
        }
      } catch {} finally { setLoading(false); }
    })();
  }, []);

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

  const initials = `${currentUser?.firstName?.[0] || ''}${currentUser?.lastName?.[0] || ''}`.toUpperCase() || 'U';
  const name = `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim() || 'User';

  return (
    <div className="flex-1 overflow-y-auto p-8 page-enter">
      {/* Profile Header */}
      <div className="bg-white rounded-2xl card-shadow-lg border border-slate-100 overflow-hidden mb-6">
        <div className="h-36 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.15),transparent)]" />
          <div className="absolute -bottom-12 left-8">
            <div className="w-24 h-24 rounded-2xl bg-white flex items-center justify-center border-4 border-white shadow-xl">
              {currentUser?.profilePicture ? (
                <img src={currentUser.profilePicture} alt={name} className="w-full h-full rounded-xl object-cover" />
              ) : (
                <span className="text-3xl font-bold bg-gradient-to-br from-indigo-600 to-purple-600 bg-clip-text text-transparent">{initials}</span>
              )}
            </div>
          </div>
          <div className="absolute top-4 right-4">
            <button
              onClick={signOut}
              className="flex items-center gap-2 px-4 py-2 bg-white/15 backdrop-blur-sm text-white rounded-xl text-sm font-medium hover:bg-white/25 transition-colors"
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </div>
        </div>
        <div className="pt-16 pb-6 px-8">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-xs font-semibold">{currentUser?.role || 'Parent'}</span>
          </div>
          <div className="flex flex-wrap gap-5 mt-5">
            {currentUser?.email && (
              <div className="flex items-center gap-2.5 text-sm text-slate-600">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center"><Mail size={14} className="text-slate-400" /></div>
                <span>{currentUser.email}</span>
              </div>
            )}
            {currentUser?.phone && (
              <div className="flex items-center gap-2.5 text-sm text-slate-600">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center"><Phone size={14} className="text-slate-400" /></div>
                <span>{currentUser.phone}</span>
              </div>
            )}
            {currentUser?.dateOfBirth && (
              <div className="flex items-center gap-2.5 text-sm text-slate-600">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center"><Calendar size={14} className="text-slate-400" /></div>
                <span>{new Date(String(currentUser.dateOfBirth)).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Children */}
      {children.length > 0 && (
        <div>
          <div className="mb-5">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Children</h2>
            <p className="text-sm text-slate-500 mt-0.5">{children.length} linked child profile{children.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {children.map((child: any) => (
              <div key={child.id} className="bg-white rounded-2xl p-6 card-shadow border border-slate-100 hover-lift">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-200">
                    <span className="text-lg font-bold text-white">{(child.firstName || 'C')[0].toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-bold text-slate-900">{child.firstName} {child.lastName}</p>
                    {child.hospital?.name && <p className="text-xs text-slate-500 mt-0.5">{child.hospital.name}</p>}
                  </div>
                </div>

                {/* Exercise tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {Object.entries(EXERCISE_TAGS).map(([key, tag]) =>
                    child[key] ? (
                      <div key={key} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${tag.bg}`}>
                        <tag.icon size={12} className={tag.text} />
                        <span className={`text-[11px] font-semibold ${tag.text}`}>{tag.label}</span>
                      </div>
                    ) : null
                  )}
                </div>

                {/* Physio */}
                {child.physioAssignments?.[0]?.physiotherapist && (
                  <div className="flex items-center gap-2.5 text-sm text-slate-600 pt-4 border-t border-slate-100">
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center"><Shield size={13} className="text-indigo-500" /></div>
                    <span className="font-medium">Dr. {child.physioAssignments[0].physiotherapist.name}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
