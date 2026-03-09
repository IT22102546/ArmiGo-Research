import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Activity, Stethoscope, Dumbbell, Eye, EyeOff, Mail, Phone, Lock, ArrowRight } from 'lucide-react';
import useAuthStore from '../stores/authStore';
import { apiFetch } from '../utils/api';

const isLikelyEmail = (value: string) => value.includes('@') || (/[a-zA-Z]/.test(value) && !(/^\d+$/.test(value.replace(/\D/g, ''))));

const formatPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) return `+94${cleaned.substring(1)}`;
  if (cleaned.length === 9) return `+94${cleaned}`;
  if (cleaned.startsWith('94')) return `+${cleaned}`;
  return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
};

export default function SignIn() {
  const navigate = useNavigate();
  const { signIn } = useAuthStore();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const isEmail = isLikelyEmail(identifier);
      const body = {
        identifier: isEmail ? identifier.trim() : formatPhone(identifier.trim()),
        password,
      };

      const res = await apiFetch('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      const json = await res.json();

      if (res.ok && json) {
        const data = json.data || json;
        const user = data.user || data;
        const accessToken = data.access_token || data.accessToken || data.token;
        const refreshToken = data.refresh_token || data.refreshToken || '';

        if (user && accessToken) {
          signIn(user, accessToken, refreshToken);
          navigate('/home');
        } else {
          setError('Invalid response from server');
        }
      } else {
        setError(json.message || json.error || 'Invalid credentials');
      }
    } catch (err) {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex bg-slate-50">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex w-[45%] relative overflow-hidden flex-col justify-between">
        {/* Background */}
        <div className="absolute inset-0 gradient-primary" />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.04) 0%, transparent 40%)' }} />

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-white/[0.03] -mr-40 -mt-40" />
        <div className="absolute bottom-0 left-0 w-60 h-60 rounded-full bg-white/[0.03] -ml-30 -mb-30" />

        {/* Floating icons */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <Heart className="absolute top-[12%] left-[8%] text-white/[0.08] animate-pulse" size={32} />
          <Activity className="absolute top-[22%] right-[12%] text-white/[0.06] animate-pulse" size={28} style={{ animationDelay: '1s' }} />
          <Stethoscope className="absolute bottom-[28%] left-[18%] text-white/[0.06] animate-pulse" size={36} style={{ animationDelay: '2s' }} />
          <Dumbbell className="absolute bottom-[18%] right-[22%] text-white/[0.08] animate-pulse" size={30} style={{ animationDelay: '0.5s' }} />
        </div>

        {/* Content */}
        <div className="relative z-10 p-12 flex-1 flex flex-col justify-center">
          <div className="w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center mb-10 backdrop-blur-sm border border-white/10">
            <img src="./logo.png" alt="ArmiGo Logo" className="w-12 h-12 object-contain" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-4 tracking-tight leading-tight">
            ArmiGo
          </h1>
          <p className="text-lg text-white/50 max-w-md leading-relaxed">
            Advanced physiotherapy management for tracking exercises, sessions, and patient progress.
          </p>

          <div className="mt-12 grid grid-cols-2 gap-3 max-w-sm">
            {[
              { icon: Activity, label: 'Exercise Tracking' },
              { icon: Stethoscope, label: 'Session Management' },
              { icon: Heart, label: 'Progress Monitoring' },
              { icon: Dumbbell, label: 'Therapy Plans' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2.5 bg-white/[0.07] rounded-xl px-3.5 py-2.5 backdrop-blur-sm border border-white/[0.06]">
                <item.icon size={16} className="text-white/60 shrink-0" />
                <span className="text-white/60 text-[13px] font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="relative z-10 p-12 pt-0">
          <p className="text-white/25 text-xs">ArmiGo Research &middot; Physiotherapy Management Platform</p>
        </div>
      </div>

      {/* Right Panel - Sign In Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-[420px]">
          {/* Mobile-only logo */}
          <div className="lg:hidden text-center mb-10">
            <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200">
              <img src="./logo.png" alt="ArmiGo Logo" className="w-10 h-10 object-contain" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">ArmiGo</h1>
          </div>

          <div className="bg-white rounded-2xl p-8 card-shadow-xl border border-slate-100">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome back</h2>
              <p className="text-slate-400 text-sm mt-1.5">Sign in to your account to continue</p>
            </div>

            {error && (
              <div className="mb-5 p-3.5 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Email or Phone</label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    {isLikelyEmail(identifier) ? <Mail size={17} /> : <Phone size={17} />}
                  </div>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Enter your email or phone"
                    className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all bg-slate-50/50 placeholder:text-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <Lock size={17} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-11 pr-12 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all bg-slate-50/50 placeholder:text-slate-300"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors">
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 gradient-primary text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-indigo-200/50 active:scale-[0.99]"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          </div>

          <p className="text-center text-xs text-slate-300 mt-6">
            ArmiGo Research &middot; Physiotherapy Management
          </p>
        </div>
      </div>
    </div>
  );
}
