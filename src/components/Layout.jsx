import { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, ChevronDown, ChevronUp, User, Building2, Home, BadgeCheck,
  Clock, Settings, Flag, Landmark, Users, ShieldCheck, KeyRound, FileSignature,
  Percent, Layers, Hash, UserCog, UserPlus, TrendingUp, Wallet,
  FileText, CalendarCheck, ArrowDownCircle, ArrowUpCircle, CheckCircle2,
  BarChart3, LogIn, History, ScrollText, ShieldAlert, SlidersHorizontal,
  ArrowLeftRight, Activity, Sun, Moon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../api/client';
import NotificationBell from './NotificationBell';

// Sidebar structure follows the business hierarchy:
// IMF -> Agences -> Utilisateurs -> Collecteurs -> Paramètres métier -> Clients -> Opérations -> Rapports -> Sécurité
const NAV_GROUPS = [
  { to: '/', label: 'Tableau de bord', icon: LayoutDashboard, standalone: true },
  { to: '/executive-dashboard', label: 'Executive Dashboard', icon: TrendingUp, standalone: true },

  {
    label: 'Administration', icon: ShieldCheck, base: '/admin', items: [
      { to: '/imf', label: 'IMF', icon: Landmark },
      { to: '/agencies', label: 'Agences', icon: Building2 },
      { to: '/users', label: 'Utilisateurs', icon: Users },
      { to: '/roles', label: 'Rôles', icon: ShieldCheck },
      { to: '/departments', label: 'Départements', icon: Building2 },
      { to: '/habilitations', label: 'Permissions', icon: KeyRound },
    ]
  },
  {
    label: 'Paramètres Métier', icon: SlidersHorizontal, base: '/settings-metier', items: [
      { to: '/contract-types', label: 'Types de contrat', icon: FileSignature },
      { to: '/commissions', label: 'Types de commission', icon: Percent },
      { to: '/commission-ranges', label: 'Tranches de commission', icon: Layers },
      { to: '/numbering', label: 'Paramètres de numérotation', icon: Hash },
    ]
  },
  {
    label: 'Gestion des Collecteurs', icon: UserCog, base: '/collectors', items: [
      { to: '/collectors', label: 'Collecteurs', icon: UserCog },
      { to: '/collector-assignment', label: 'Affectation des collecteurs', icon: UserPlus },
      { to: '/collector-performance', label: 'Performance des collecteurs', icon: TrendingUp },
    ]
  },
  {
    label: 'Gestion des Clients', icon: Users, base: '/clients-mgmt', items: [
      { to: '/clients', label: 'Clients', icon: User },
      { to: '/contracts', label: 'Contrats des clients', icon: FileText },
      { to: '/accounts', label: 'Comptes', icon: Wallet },
    ]
  },
  {
    label: 'Prêts', icon: Landmark, base: '/loans', items: [
      { to: '/loans', label: 'Loan Management', icon: Landmark },
    ]
  },
  {
    label: 'Documents', icon: FileText, base: '/documents', items: [
      { to: '/documents', label: 'Document Management', icon: FileText },
    ]
  },
  {
    label: 'Comptabilité', icon: BarChart3, base: '/accounting', items: [
      { to: '/accounting', label: 'Accounting Management', icon: BarChart3 },
    ]
  },
  {
    label: 'Opérations', icon: ArrowLeftRight, base: '/operations', items: [
      { to: '/cash-session', label: 'Session de caisse', icon: Clock },
      { to: '/teller', label: 'Teller Management (Coffre)', icon: Landmark },
      { to: '/daily-collections', label: 'Collectes journalières', icon: CalendarCheck },
      { to: '/deposits', label: 'Dépôts', icon: ArrowDownCircle },
      { to: '/withdrawals', label: 'Retraits', icon: ArrowUpCircle },
      { to: '/transfers', label: 'Transferts', icon: ArrowLeftRight },
      { to: '/validations', label: 'Validation des opérations', icon: CheckCircle2 },
    ]
  },
  {
    label: 'Rapports', icon: BarChart3, base: '/reports', items: [
      { to: '/reports/center', label: 'Report Center', icon: Home },
      { to: '/reports/transaction-history', label: 'Transaction History', icon: History },
      { to: '/reports/receipts', label: 'Receipts', icon: FileText },
      { to: '/reports/daily-collections', label: 'Daily Collection Reports', icon: CalendarCheck },
      { to: '/collector-performance', label: 'Collector Reports', icon: UserCog },
      { to: '/reports/clients', label: 'Client Reports', icon: Users },
      { to: '/reports/accounts', label: 'Account Reports', icon: Wallet },
      { to: '/reports/contracts', label: 'Contract Reports', icon: FileSignature },
      { to: '/reports/commissions', label: 'Commission Reports', icon: Percent },
      { to: '/reports/cash-sessions', label: 'Cash Session Reports', icon: Clock },
      { to: '/reports/agencies', label: 'Agency Reports', icon: Building2 },
      { to: '/reports/financial', label: 'Financial Reports', icon: TrendingUp },
      { to: '/reports/audit', label: 'Audit Reports', icon: ScrollText },
    ]
  },
  {
    label: 'Sécurité', icon: ShieldAlert, base: '/security', items: [
      { to: '/security/sessions', label: 'Active Sessions', icon: LogIn },
      { to: '/security/fraud-detection', label: 'Fraud Detection', icon: ShieldAlert },
      { to: '/security/failed-logins', label: 'Failed Login Attempts', icon: ShieldAlert },
      { to: '/reports/audit', label: 'Audit & Login History', icon: ScrollText },
      { to: '/security/settings', label: 'Password Policy & API', icon: KeyRound },
      { to: '/security/system-health', label: 'System Health', icon: Activity },
    ]
  },
];

function SidebarItem({ group }) {
  const location = useLocation();
  const Icon = group.icon;

  if (group.standalone) {
    const isActive = location.pathname === group.to;
    return (
      <NavLink
        to={group.to}
        end={group.to === '/'}
        className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs font-semibold uppercase transition-colors
          ${isActive ? 'text-brand-blue' : 'text-gray-600 hover:bg-gray-50'}`}
      >
        <Icon size={16} className={isActive ? 'text-brand-blue' : 'text-gray-400'} />
        {group.label}
      </NavLink>
    );
  }

  const isGroupActive = group.items.some((i) => location.pathname === i.to);
  const [open, setOpen] = useState(isGroupActive);

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-semibold uppercase transition-colors
          ${isGroupActive ? 'text-brand-blue' : 'text-gray-600 hover:bg-gray-50'}`}
      >
        <span className="flex items-center gap-2">
          <Icon size={16} className={isGroupActive ? 'text-brand-blue' : 'text-gray-400'} />
          {group.label}
        </span>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {open && (
        <div className="ml-4 mt-1 flex flex-col gap-1">
          {group.items.map((item) => {
            const active = location.pathname === item.to;
            const ItemIcon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-[11px] font-semibold uppercase transition-colors
                  ${active ? 'bg-brand-blue text-white' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                <ItemIcon size={13} className={active ? 'text-white' : 'text-gray-400'} />
                {item.label}
              </NavLink>
            );
          })}
        </div>
      )}
    </div>
  );
}

function NavPill({ icon, children }) {
  return (
    <span className="flex items-center gap-1.5 text-white text-[11px] font-semibold whitespace-nowrap">
      {icon}
      {children}
    </span>
  );
}

function Avatar({ name, photoUrl }) {
  const initials = (name || '?').slice(0, 2).toUpperCase();
  if (photoUrl) {
    return (
      <img
        src={photoUrl.startsWith('http') ? photoUrl : `${API_BASE_URL}${photoUrl}`}
        alt={name}
        className="w-8 h-8 rounded-full object-cover border border-white/40"
        onError={(e) => { e.target.style.display = 'none'; }}
      />
    );
  }
  return (
    <div className="w-8 h-8 rounded-full bg-white/20 border border-white/40 flex items-center justify-center text-white text-[11px] font-bold">
      {initials}
    </div>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('dsv_theme') === 'dark');
  const [showIdleWarning, setShowIdleWarning] = useState(false);

  const IDLE_WARNING_AFTER_MS = 10 * 60 * 1000; // 10 min of inactivity triggers the prompt
  const IDLE_TIMEOUT_REF = useRef(null);

  useEffect(() => {
    const resetTimer = () => {
      if (IDLE_TIMEOUT_REF.current) clearTimeout(IDLE_TIMEOUT_REF.current);
      IDLE_TIMEOUT_REF.current = setTimeout(() => setShowIdleWarning(true), IDLE_WARNING_AFTER_MS);
    };
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach((e) => window.addEventListener(e, resetTimer));
    resetTimer();
    return () => {
      events.forEach((e) => window.removeEventListener(e, resetTimer));
      if (IDLE_TIMEOUT_REF.current) clearTimeout(IDLE_TIMEOUT_REF.current);
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('dsv_theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const now = new Date();
  const dateStr = now.toLocaleDateString('fr-FR');
  const timeStr = now.toLocaleTimeString('fr-FR');

  return (
    <div className="flex min-h-screen bg-gray-50 normal-case">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
        <div className="px-5 py-5 bg-brand-blue flex items-center gap-2">
          <div className="w-9 h-9 rounded-md bg-white flex items-center justify-center overflow-hidden">
            <img src="/logo.png" alt="AnyCollect" className="w-full h-full object-contain" />
          </div>
          <div className="text-lg font-extrabold normal-case text-white">
            Any<span className="text-white/80">collect</span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-3 overflow-y-auto flex flex-col gap-1">
          {NAV_GROUPS.map((group) => (
            <SidebarItem key={group.label} group={group} />
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-gray-100">
          <div className="text-[10px] text-gray-400 font-semibold mb-1">RÔLE:</div>
          <span className="inline-block border border-brand-blue text-brand-blue text-[11px] font-bold px-2.5 py-1 rounded">
            {user?.roleCode || '—'}
          </span>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-brand-blue flex items-center gap-5 px-5 flex-wrap shadow-sm">
          <NavPill icon={<User size={13} />}>{user?.codeUser}</NavPill>
          <NavPill icon={<Building2 size={13} />}>{user?.agenceNom || 'SIÈGE'}</NavPill>
          <NavPill icon={<Home size={13} />}>{user?.agenceCode || '—'}</NavPill>
          <NavPill icon={<BadgeCheck size={13} />}>RÔLE: {user?.roleCode}</NavPill>

          <span className="flex items-center gap-1.5 text-white/80 text-[11px] italic">
            <Clock size={13} />
            {dateStr} {timeStr}
          </span>

          <div className="ml-auto flex items-center gap-4">
            <NotificationBell />
            <button className="text-white/80 hover:text-white" title={darkMode ? 'Mode clair' : 'Mode sombre'} onClick={() => setDarkMode(!darkMode)}>
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button className="text-white/80 hover:text-white" title="Paramètres">
              <Settings size={18} />
            </button>
            <button className="text-white/80 hover:text-white" title="Langue">
              <Flag size={18} />
            </button>
            <button className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded border border-white/30" onClick={handleLogout}>
              Déconnexion
            </button>
            <Avatar name={user?.username} photoUrl={user?.photoUrl} />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-5 normal-case">
          <Outlet />
        </main>
      </div>

      {showIdleWarning && (
        <div className="fixed inset-0 bg-black/40 z-[3000] flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-[360px] text-center">
            <div className="text-sm font-semibold text-gray-800 normal-case mb-1">Session inactive</div>
            <p className="text-xs text-gray-500 normal-case mb-4">
              Vous êtes inactif depuis un moment. Voulez-vous prolonger votre session ou vous déconnecter ?
            </p>
            <div className="flex gap-2 justify-center">
              <button className="btn btn-outline btn-sm" onClick={handleLogout}>Se déconnecter</button>
              <button className="btn btn-primary btn-sm" onClick={() => setShowIdleWarning(false)}>Prolonger la session</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
