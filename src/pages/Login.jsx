import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, PiggyBank, Handshake, ShieldCheck, TrendingUp, Zap, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const SIDE_ICONS_LEFT = [
  { icon: PiggyBank, label: 'Épargne' },
  { icon: Handshake, label: 'Microcrédit' },
];
const SIDE_ICONS_RIGHT = [
  { icon: ShieldCheck, label: 'Confiance' },
  { icon: TrendingUp, label: 'Croissance' },
];

const BOTTOM_BADGES = [
  { icon: ShieldCheck, label: 'Sécurisé', sub: 'Vos données sont protégées' },
  { icon: Zap, label: 'Rapide', sub: 'Accédez à vos informations en temps réel' },
  { icon: Users, label: 'Fiable', sub: 'Une solution éprouvée pour votre croissance' },
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
    <div className={`relative h-screen w-full flex flex-col normal-case overflow-hidden ${dark ? 'bg-[#060b18]' : 'bg-[#eef3fb]'}`}>
      {/* Decorative blurred background — no stock photos, pure CSS */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute rounded-full blur-[110px] opacity-50 animate-[float1_18s_ease-in-out_infinite]"
          style={{ width: 480, height: 480, top: '-10%', left: '-8%', background: dark ? '#1E90FF' : '#8fc6ff' }} />
        <div className="absolute rounded-full blur-[130px] opacity-40 animate-[float2_22s_ease-in-out_infinite]"
          style={{ width: 560, height: 560, bottom: '-14%', right: '-10%', background: dark ? '#11fc82' : '#9df3c4' }} />
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(${dark ? 'rgba(255,255,255,0.07)' : 'rgba(11,28,61,0.05)'} 1px, transparent 1px)`,
          backgroundSize: '26px 26px',
        }} />
      </div>
      <style>{`
        @keyframes float1 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(40px,50px) scale(1.08); } }
        @keyframes float2 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-40px,-35px) scale(1.06); } }
      `}</style>

      {/* Center row: side icons + card + side icons */}
      <div className="flex-1 relative z-10 flex items-center justify-center gap-10 px-4">
        <div className="hidden xl:flex flex-col gap-8">
          {SIDE_ICONS_LEFT.map((s) => (
            <div key={s.label} className="flex flex-col items-center gap-2">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${dark ? 'border-brand-green/50 bg-white/5' : 'border-brand-blue/30 bg-white'}`}>
                <s.icon size={20} className={dark ? 'text-brand-green' : 'text-brand-blue'} />
              </div>
              <span className={`text-xs font-semibold ${dark ? 'text-white/70' : 'text-gray-600'}`}>{s.label}</span>
            </div>
          ))}
        </div>

        <div className={`w-full max-w-sm rounded-2xl shadow-2xl p-6 sm:p-7 backdrop-blur-xl ${dark ? 'bg-white/[0.06] border border-white/15' : 'bg-white/70 border border-white/90'}`}>
          <div className="flex flex-col items-center mb-4">
            <img src="/logo.png" alt="AnyCollect" className="w-16 h-16 object-contain" />
            <div className={`text-xl font-extrabold mt-1 ${dark ? 'text-white' : 'text-brand-navy'}`}>
              Any<span className="text-brand-green">collect</span>
            </div>
            <div className={`text-[10px] tracking-widest font-semibold ${dark ? 'text-white/40' : 'text-gray-400'}`}>
              COLLECT TODAY, EMPOWER TOMORROW
            </div>
          </div>

          {error && <div className="error-banner mb-3">{error}</div>}

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="form-group">
              <label className={dark ? 'text-white/70' : ''}>Nom d'utilisateur</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
                placeholder="Entrez votre nom d'utilisateur"
                className={dark ? 'bg-white/[0.07] border-white/20 text-white placeholder:text-white/30' : 'bg-white/70 border-white/90'}
              />
            </div>
            <div className="form-group">
              <label className={dark ? 'text-white/70' : ''}>Mot de passe</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Entrez votre mot de passe"
                  className={dark ? 'bg-white/[0.07] border-white/20 text-white placeholder:text-white/30 pr-10' : 'bg-white/70 border-white/90 pr-10'}
                />
                <button type="button" onClick={() => setShowPassword((s) => !s)} tabIndex={-1}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 ${dark ? 'text-white/40 hover:text-white/70' : 'text-gray-400 hover:text-gray-600'}`}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              className="w-full py-2.5 rounded-lg font-semibold text-white bg-gradient-to-r from-brand-blue to-brand-green shadow disabled:opacity-60 mt-1"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>

          <p className={`text-[10px] text-center normal-case mt-4 ${dark ? 'text-white/30' : 'text-gray-400'}`}>
            © {new Date().getFullYear()} AnyCollect. Tous droits réservés.
          </p>
        </div>

        <div className="hidden xl:flex flex-col gap-8">
          {SIDE_ICONS_RIGHT.map((s) => (
            <div key={s.label} className="flex flex-col items-center gap-2">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${dark ? 'border-brand-green/50 bg-white/5' : 'border-brand-blue/30 bg-white'}`}>
                <s.icon size={20} className={dark ? 'text-brand-green' : 'text-brand-blue'} />
              </div>
              <span className={`text-xs font-semibold ${dark ? 'text-white/70' : 'text-gray-600'}`}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom trust bar */}
      <div className={`relative z-10 hidden sm:flex justify-center gap-10 py-3 border-t ${dark ? 'border-white/10 bg-white/[0.03]' : 'border-black/5 bg-white/40'}`}>
        {BOTTOM_BADGES.map((b) => (
          <div key={b.label} className="flex items-center gap-2 max-w-[220px]">
            <b.icon size={18} className={dark ? 'text-brand-green' : 'text-brand-blue'} />
            <div>
              <div className={`text-[11px] font-bold ${dark ? 'text-white/80' : 'text-gray-700'}`}>{b.label}</div>
              <div className={`text-[10px] normal-case ${dark ? 'text-white/40' : 'text-gray-400'}`}>{b.sub}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
