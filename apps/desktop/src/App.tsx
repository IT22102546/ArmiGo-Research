import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import useAuthStore from './stores/authStore';
import useNotificationStore from './stores/notificationStore';
import { socket } from './utils/socket';
import TitleBar from './components/TitleBar';
import Sidebar from './components/Sidebar';
import SignIn from './pages/SignIn';
import Home from './pages/Home';
import Assignments from './pages/Assignments';
import Publications from './pages/Publications';
import Physiotherapists from './pages/Physiotherapists';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import OnlineSessions from './pages/OnlineSessions';
import PhysicalSessions from './pages/PhysicalSessions';
import Exams from './pages/Exams';
import ClassLinks from './pages/ClassLinks';



function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isSignedIn } = useAuthStore();
  const location = useLocation();

  if (!isSignedIn) {
    return <Navigate to="/sign-in" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

function AppLayout() {
  return (
    <div className="flex h-[calc(100vh-32px)]">
      <Sidebar />
      <main className="flex-1 bg-slate-50 overflow-hidden flex flex-col">
        <Routes>
          <Route path="/home" element={<Home />} />
          <Route path="/assignments" element={<Assignments />} />
          <Route path="/publications" element={<Publications />} />
          <Route path="/physiotherapists" element={<Physiotherapists />} />
          <Route path="/online-sessions" element={<OnlineSessions />} />
          <Route path="/physical-sessions" element={<PhysicalSessions />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/exams" element={<Exams />} />
          <Route path="/class-links" element={<ClassLinks />} />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
    
      </main>
    </div>
  );
}

export default function App() {
  const { checkAuthStatus, isSignedIn, currentUser, accessToken, authChecked } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Socket connection for real-time notifications
  useEffect(() => {
    if (!isSignedIn || !currentUser?.id || !accessToken) return;
    socket.connect();
    socket.emit('authenticate', { userId: currentUser.id, token: accessToken });
    socket.on('notification', (data: any) => {
      if (data) {
        useNotificationStore.getState().addNotification({
          id: data.id || `temp-${Date.now()}`,
          userId: data.userId || currentUser.id!,
          title: data.title || 'New Notification',
          message: data.message || '',
          type: data.type || 'GENERAL',
          status: 'UNREAD',
          isRead: false,
          metadata: data.metadata,
          sentAt: data.sentAt || new Date().toISOString(),
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
        });
      }
    });
    socket.on('announcement', (data: any) => {
      if (data) {
        useNotificationStore.getState().fetchAnnouncements();
      }
    });
    useNotificationStore.getState().refresh();
    return () => {
      socket.off('notification');
      socket.off('announcement');
      socket.disconnect();
    };
  }, [isSignedIn, currentUser?.id, accessToken]);

  // Prevent blank screen: show nothing until authChecked
  if (!authChecked) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      <TitleBar />
      <Routes>
        <Route path="/sign-in" element={
          isSignedIn ? <Navigate to="/home" replace /> : <SignIn />
        } />
        <Route path="/*" element={
          <AuthGuard>
            <AppLayout />
          </AuthGuard>
        } />
      </Routes>
    </div>
  );
}
