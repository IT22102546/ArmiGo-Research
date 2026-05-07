import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home, ClipboardList, BookOpen, Users, Bell, User,
  Video, Activity, GraduationCap, Link2, Megaphone,
  ChevronLeft, ChevronRight, LogOut, Sparkles,
} from 'lucide-react';
import useAuthStore from '../stores/authStore';
import useNotificationStore from '../stores/notificationStore';
import { useState } from 'react';

const parentMenuItems = [
  { icon: Home, label: 'Home', path: '/home' },
  { icon: ClipboardList, label: 'Assignments', path: '/assignments' },
  { icon: BookOpen, label: 'Publications', path: '/publications' },
  { icon: Users, label: 'Physiotherapists', path: '/physiotherapists' },
  { icon: Video, label: 'Online Sessions', path: '/online-sessions' },
  { icon: Activity, label: 'Physical Sessions', path: '/physical-sessions' },
    // Removed Exams and Class Links
  { icon: Bell, label: 'Notifications', path: '/notifications' },
  { icon: User, label: 'Profile', path: '/profile' },
];

const teacherMenuItems = [
  { icon: Home, label: 'Home', path: '/home' },
  { icon: Users, label: 'Search & Matches', path: '/search-matches' },
  { icon: ClipboardList, label: 'Transfer Requests', path: '/transfer-requests' },
  { icon: Bell, label: 'Notifications', path: '/notifications' },
  { icon: User, label: 'Profile', path: '/profile' },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, signOut } = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const [collapsed, setCollapsed] = useState(false);

  const isTeacher = currentUser?.role === 'Teacher' ||
    currentUser?.role === 'INTERNAL_TEACHER' ||
    currentUser?.role === 'EXTERNAL_TEACHER';

  const menuItems = isTeacher ? teacherMenuItems : parentMenuItems;

  const initials = `${currentUser?.firstName?.[0] || ''}${currentUser?.lastName?.[0] || ''}`.toUpperCase() || 'U';
  const displayName = `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim() || 'User';

  const handleSignOut = () => {
    signOut();
    navigate('/sign-in');
  };

  return (
    <div className={`h-full bg-white/80 backdrop-blur-xl border-r border-slate-200/60 flex flex-col transition-all duration-300 ${collapsed ? 'w-[72px]' : 'w-[260px]'}`}>
      {/* Brand */}
      <div className={`px-4 py-4 border-b border-slate-100 ${collapsed ? 'items-center' : ''}`}>
        <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shrink-0 shadow-lg shadow-indigo-200">
            <img src="./logo.png" alt="ArmiGo Logo" className="w-8 h-8 object-contain" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-base font-bold text-slate-900 tracking-tight">ArmiGo</p>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Desktop</p>
            </div>
          )}
        </div>
      </div>

      {/* User Profile */}
      <div className={`px-3 py-3 ${collapsed ? 'items-center' : ''}`}>
        <div className={`flex items-center gap-3 p-2 rounded-xl bg-slate-50/80 ${collapsed ? 'justify-center p-2' : ''}`}>
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center shrink-0">
            <span className="text-indigo-600 text-xs font-bold">{initials}</span>
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-800 truncate">{displayName}</p>
              <p className="text-[11px] text-slate-400 truncate">{currentUser?.role?.replace(/_/g, ' ') || 'Parent'}</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-1 px-3">
        <div className="space-y-0.5">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            const showBadge = item.path === '/notifications' && unreadCount > 0;

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative
                  ${isActive
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                  }
                  ${collapsed ? 'justify-center' : ''}
                `}
              >
                <div className="relative shrink-0">
                  <Icon size={19} strokeWidth={isActive ? 2.2 : 1.8} />
                  {showBadge && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center px-1 shadow-sm shadow-red-200">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </div>
                {!collapsed && (
                  <span className={`text-[13px] truncate ${isActive ? 'font-semibold' : 'font-medium'}`}>
                    {item.label}
                  </span>
                )}
                {isActive && !collapsed && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500" />
                )}
                {collapsed && (
                  <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity shadow-lg">
                    {item.label}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-slate-100 space-y-1">
        <button
          onClick={handleSignOut}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all ${collapsed ? 'justify-center' : ''}`}
        >
          <LogOut size={18} strokeWidth={1.8} />
          {!collapsed && <span className="text-[13px] font-medium">Sign Out</span>}
        </button>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-300 hover:bg-slate-50 hover:text-slate-500 transition-all ${collapsed ? 'justify-center' : ''}`}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          {!collapsed && <span className="text-[11px] font-medium">Collapse</span>}
        </button>
      </div>
    </div>
  );
}
