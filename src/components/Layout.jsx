import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { to: '/', label: 'Tableau de bord', icon: '📊', end: true },
  { to: '/agencies', label: 'Agences', icon: '🏢' },
  { to: '/users', label: 'Utilisateurs', icon: '👤' },
  { to: '/collectors', label: 'Collecteurs', icon: '🧾' },
  { to: '/clients', label: 'Clients', icon: '🧍' },
  { to: '/accounts', label: 'Comptes', icon: '💳' },
  { to: '/contracts', label: 'Contrats', icon: '📄' },
  { to: '/commissions', label: 'Commissions', icon: '💰' },
  { to: '/imf', label: 'IMF', icon: '🏦' },
  { to: '/validations', label: 'Validations', icon: '✅' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const initials = (user?.username || '?').slice(0, 2).toUpperCase();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">Daily<span>Saving</span>V</div>
        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
            >
              <span>{item.icon}</span> {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          {user?.agenceNom ? `Agence : ${user.agenceNom}` : 'Accès Siège (toutes agences)'}
        </div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <div />
          <div className="topbar-user">
            <span>{user?.username} · <strong>{user?.roleCode}</strong></span>
            <div className="topbar-badge">{initials}</div>
            <button className="btn btn-outline btn-sm" onClick={handleLogout}>Déconnexion</button>
          </div>
        </header>
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
