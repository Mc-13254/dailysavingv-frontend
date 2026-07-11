import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ShieldCheck, Lock, Users2, Wallet, Landmark, Calculator, BarChart3, ShieldAlert, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const FEATURES = [
  { icon: Wallet, title: 'Daily Collections', desc: 'Track and manage daily collections' },
  { icon: Landmark, title: 'Loan Management', desc: 'Applications, disbursement, repayment' },
  { icon: Calculator, title: 'Accounting & GL', desc: 'Double-entry accounting engine' },
  { icon: BarChart3, title: 'Reports & Analytics', desc: 'Real-time insights across 12 modules' },
  { icon: ShieldAlert, title: 'Security & Fraud Detection', desc: 'Role-based access, transparent risk scoring' },
  { icon: LayoutDashboard, title: 'Executive Dashboard', desc: 'Institution-wide overview' },
];

const TRUST_BADGES = [
  { icon: ShieldCheck, label: 'Secure Authentication', sub: 'JWT + password policy' },
  { icon: Lock, label: 'Encrypted Communication', sub: 'HTTPS end-to-end' },
  { icon: Users2, label: 'Role-Based Access', sub: 'Granular permissions' },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [dark, setDark] = useState(() => localStorage.getItem('dsv_theme') === 'dark');

  useEffect(() => {
    const onStorage = () => setDark(localStorage.getItem('dsv_theme') === 'dark');
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError(err?.response?.data?.message || 'Identifiants invalides. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`relative min-h-screen w-full flex normal-case overflow-hidden ${dark ? 'bg-[#060b18]' : 'bg-[#eef3fb]'}`}>
      {/* Animated blurred gradient orbs — the "unique" background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute rounded-full blur-[110px] opacity-50 animate-[float1_18s_ease-in-out_infinite]"
          style={{ width: 520, height: 520, top: '-8%', left: '-6%', background: dark ? '#1E90FF' : '#8fc6ff' }}
        />
        <div
          className="absolute rounded-full blur-[130px] opacity-40 animate-[float2_22s_ease-in-out_infinite]"
          style={{ width: 600, height: 600, bottom: '-12%', right: '-8%', background: dark ? '#11fc82' : '#9df3c4' }}
        />
        <div
          className="absolute rounded-full blur-[100px] opacity-30 animate-[float1_26s_ease-in-out_infinite_reverse]"
          style={{ width: 380, height: 380, top: '35%', left: '38%', background: dark ? '#7c3aed' : '#c9b8fb' }}
        />
        {/* Dot-grid mesh overlay for texture */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(${dark ? 'rgba(255,255,255,0.08)' : 'rgba(11,28,61,0.06)'} 1px, transparent 1px)`,
            backgroundSize: '26px 26px',
          }}
        />
      </div>

      <style>{`
        @keyframes float1 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(40px,60px) scale(1.1); } }
        @keyframes float2 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-50px,-40px) scale(1.08); } }
      `}</style>

      {/* Left hero panel — hidden on small screens */}
      <div className="hidden lg:flex lg:w-1/2 relative z-10 flex-col justify-between p-12">
          <div className="flex items-center gap-3 mb-10">
            <img src="/logo.png" alt="AnyCollect" className="w-14 h-14 object-contain rounded-xl bg-white p-1 shadow" />
            <div>
              <div className={`text-2xl font-extrabold leading-tight ${dark ? 'text-white' : 'text-brand-navy'}`}>
                Any<span className="text-brand-green">collect</span>
              </div>
              <div className={`text-[10px] tracking-widest font-semibold ${dark ? 'text-white/50' : 'text-gray-400'}`}>
                COLLECT TODAY, EMPOWER TOMORROW
              </div>
            </div>
          </div>

          <h1 className={`text-3xl font-extrabold leading-snug mb-1 ${dark ? 'text-white' : 'text-brand-navy'}`}>
            Enterprise Intelligent<br />Core Banking System
          </h1>
          <div className="w-14 h-1 bg-gradient-to-r from-brand-blue to-brand-green rounded-full mt-3 mb-10" />

          <div className="grid grid-cols-1 gap-5">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${dark ? 'bg-white/10' : 'bg-white shadow-sm'}`}>
                  <f.icon size={18} className={dark ? 'text-brand-green' : 'text-brand-blue'} />
                </div>
                <div>
                  <div className={`text-sm font-semibold ${dark ? 'text-white' : 'text-gray-800'}`}>{f.title}</div>
                  <div className={`text-xs normal-case ${dark ? 'text-white/50' : 'text-gray-500'}`}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>

        <div className={`relative z-10 flex flex-wrap gap-6 pt-8 border-t ${dark ? 'border-white/10' : 'border-black/5'}`}>
          {TRUST_BADGES.map((b) => (
            <div key={b.label} className="flex items-center gap-2">
              <b.icon size={16} className={dark ? 'text-brand-green' : 'text-brand-blue'} />
              <div>
                <div className={`text-[11px] font-semibold ${dark ? 'text-white/80' : 'text-gray-700'}`}>{b.label}</div>
                <div className={`text-[10px] ${dark ? 'text-white/40' : 'text-gray-400'}`}>{b.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — the actual login form */}
      <div className="flex-1 relative z-10 flex items-center justify-center p-6">
        <div
          className={`w-full max-w-sm rounded-2xl shadow-2xl p-8 backdrop-blur-xl ${
            dark ? 'bg-white/[0.06] border border-white/15' : 'bg-white/60 border border-white/80'
          }`}
        >
          <div className="flex justify-center mb-5 lg:hidden">
            <img src="/logo.png" alt="AnyCollect" className="w-16 h-16 object-contain" />
          </div>

          <h2 className={`text-xl font-bold text-center ${dark ? 'text-white' : 'text-gray-800'}`}>Welcome Back</h2>
          <p className={`text-xs text-center normal-case mt-1 mb-6 ${dark ? 'text-white/50' : 'text-gray-500'}`}>
            Sign in to continue managing your institution securely.
          </p>

          {error && <div className="error-banner mb-4">{error}</div>}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="form-group">
              <label className={dark ? 'text-white/70' : ''}>Username</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
                placeholder="Enter your username"
                className={dark ? 'bg-white/[0.07] border-white/20 text-white placeholder:text-white/30' : 'bg-white/70 border-white/90'}
              />
            </div>
            <div className="form-group">
              <label className={dark ? 'text-white/70' : ''}>Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                  className={dark ? 'bg-white/[0.07] border-white/20 text-white placeholder:text-white/30 pr-10' : 'bg-white/70 border-white/90 pr-10'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 ${dark ? 'text-white/40 hover:text-white/70' : 'text-gray-400 hover:text-gray-600'}`}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              className="w-full py-2.5 rounded-lg font-semibold text-white bg-gradient-to-r from-brand-blue to-brand-green shadow disabled:opacity-60"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Connexion…' : 'Sign In'}
            </button>
          </form>

          <p className={`text-[11px] text-center normal-case mt-6 ${dark ? 'text-white/30' : 'text-gray-400'}`}>
            © {new Date().getFullYear()} AnyCollect. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
