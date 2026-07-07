import { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, ChevronDown, ChevronUp, User, Building2, Home, BadgeCheck,
  Clock, Settings, Flag, Landmark, Users, ShieldCheck, KeyRound, FileSignature,
  Percent, Layers, Hash, UserCog, UserPlus, TrendingUp, UserSearch, Wallet,
  FileText, CalendarCheck, ArrowDownCircle, ArrowUpCircle, CheckCircle2,
  BarChart3, LogIn, History, ScrollText, ShieldAlert, SlidersHorizontal,
  ArrowLeftRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Sidebar structure follows the business hierarchy:
// IMF -> Agences -> Utilisateurs -> Collecteurs -> Paramètres métier -> Clients -> Opérations -> Rapports -> Sécurité
const NAV_GROUPS = [
  { to: '/', label: 'Tableau de bord', icon: LayoutDashboard, standalone: true },

  {
    label: 'Administration', icon: ShieldCheck, base: '/admin', items: [
      { to: '/imf', label: 'IMF', icon: Landmark },
      { to: '/agencies', label: 'Agences', icon: Building2 },
      { to: '/users', label: 'Utilisateurs', icon: Users },
      { to: '/roles', label: 'Rôles', icon: ShieldCheck },
      { to: '/departments', label: 'Départements', icon: Building2 },
      { to: '/habilitations', label: 'Habilitations / Permissions', icon: KeyRound },
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
      { to: '/prospects', label: 'Prospects', icon: UserSearch },
      { to: '/clients', label: 'Clients', icon: User },
      { to: '/accounts', label: 'Comptes', icon: Wallet },
      { to: '/contracts', label: 'Contrats des clients', icon: FileText },
    ]
  },
  {
    label: 'Opérations', icon: ArrowLeftRight, base: '/operations', items: [
      { to: '/daily-collections', label: 'Collectes journalières', icon: CalendarCheck },
      { to: '/deposits', label: 'Dépôts', icon: ArrowDownCircle },
      { to: '/withdrawals', label: 'Retraits', icon: ArrowUpCircle },
      { to: '/validations', label: 'Validation des opérations', icon: CheckCircle2 },
    ]
  },
  {
    label: 'Rapports', icon: BarChart3, base: '/reports', items: [
      { to: '/reports/collectors', label: 'Rapport des collecteurs', icon: UserCog },
      { to: '/reports/clients', label: 'Rapport des clients', icon: Users },
      { to: '/reports/agencies', label: 'Rapport des agences', icon: Building2 },
      { to: '/reports/commissions', label: 'Commissions', icon: Percent },
    ]
  },
  {
    label: 'Sécurité', icon: ShieldAlert, base: '/security', items: [
      { to: '/security/logins', label: 'Journal des connexions', icon: LogIn },
      { to: '/security/history', label: 'Historique', icon: History },
      { to: '/security/audit', label: 'Audit', icon: ScrollText },
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

function Avatar({ name }) {
  const initials = (name || '?').slice(0, 2).toUpperCase();
  return (
    <div className="w-8 h-8 rounded-full bg-white/20 border border-white/40 flex items-center justify-center text-white text-[11px] font-bold">
      {initials}
    </div>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
          <div className="w-9 h-9 rounded-md bg-white/15 border border-white/30 flex items-center justify-center text-white font-bold text-sm">
            AC
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
            <button className="text-white/80 hover:text-white" title="Paramètres">
              <Settings size={18} />
            </button>
            <button className="text-white/80 hover:text-white" title="Langue">
              <Flag size={18} />
            </button>
            <button className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded border border-white/30" onClick={handleLogout}>
              Déconnexion
            </button>
            <Avatar name={user?.username} />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-5 normal-case">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
