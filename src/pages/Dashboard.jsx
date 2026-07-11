import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wallet, ArrowLeftRight, Users, Landmark, UserPlus, Wallet2, CalendarPlus,
  FileText, TrendingUp, TrendingDown, Building2, ChevronDown,
  Bell, Info, AlertTriangle,
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, CartesianGrid,
} from 'recharts';
import { ReportsAPI, LoanAPI, NotificationAPI } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';

const fmt = (n) => new Intl.NumberFormat('fr-FR').format(Math.round(n || 0));
const COLORS = ['#1E90FF', '#11fc82', '#7c3aed', '#f59e0b'];

function KpiCard({ icon: Icon, color, label, value, delta, trend }) {
  return (
    <div className="form-card flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}20` }}>
            <Icon size={20} style={{ color }} />
          </div>
          <div>
            <div className="text-[11px] text-gray-500">{label}</div>
            <div className="text-lg font-bold text-gray-800">{fmt(value)} <span className="text-[11px] font-medium text-gray-400">FCFA</span></div>
          </div>
        </div>
      </div>
      {delta != null && (
        <div className={`text-[11px] font-semibold flex items-center gap-1 ${delta >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
          {delta >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />} {Math.abs(delta).toFixed(1)}% vs hier
        </div>
      )}
      {trend && trend.length > 1 && (
        <div style={{ height: 40 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend}>
              <Area type="monotone" dataKey="v" stroke={color} fill={color} fillOpacity={0.15} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

const QUICK_ACTIONS = [
  { label: 'New Client', icon: UserPlus, color: '#1E90FF', to: '/clients' },
  { label: 'New Account', icon: Wallet2, color: '#11fc82', to: '/accounts' },
  { label: 'New Collection', icon: CalendarPlus, color: '#7c3aed', to: '/daily-collections' },
  { label: 'New Loan', icon: Landmark, color: '#f59e0b', to: '/loans' },
  { label: 'Cash Transfer', icon: ArrowLeftRight, color: '#1E90FF', to: '/transfers' },
  { label: 'Reports', icon: FileText, color: '#11fc82', to: '/reports/center' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [exec, setExec] = useState(null);
  const [stats, setStats] = useState(null);
  const [trend, setTrend] = useState([]);
  const [agencies, setAgencies] = useState([]);
  const [topClients, setTopClients] = useState([]);
  const [loanDash, setLoanDash] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      ReportsAPI.executive().catch(() => null),
      ReportsAPI.transactionStats().catch(() => null),
      ReportsAPI.financialTrend(14).catch(() => ({ data: [] })),
      ReportsAPI.agencies().catch(() => ({ data: [] })),
      ReportsAPI.clients({}).catch(() => ({ data: [] })),
      LoanAPI.dashboard().catch(() => null),
      NotificationAPI.list(false).catch(() => ({ data: [] })),
    ]).then(([e, s, t, ag, cl, ld, notif]) => {
      setExec(e?.data || null);
      setStats(s?.data || null);
      setTrend((t?.data || []).map((d) => ({ ...d, total: d.collections + d.deposits + d.withdrawals + d.transfers })));
      setAgencies((ag?.data || []).slice(0, 5));
      setTopClients((cl?.data || []).slice().sort((a, b) => (b.totalBalance || 0) - (a.totalBalance || 0)).slice(0, 5));
      setLoanDash(ld?.data || null);
      setNotifications((notif?.data || []).slice(0, 6));
      setLoading(false);
    });
  }, []);

  const sparkline = (key) => trend.map((d) => ({ v: d[key] }));
  const firstName = user?.username?.split(/[.\s]/)[0] || user?.username || '';

  const mixData = stats ? [
    { name: 'Collectes', value: stats.totalCollections },
    { name: 'Dépôts', value: stats.totalDeposits },
    { name: 'Retraits', value: stats.totalWithdrawals },
    { name: 'Transferts', value: stats.totalTransfers },
  ].filter((d) => d.value > 0) : [];

  return (
    <div className="space-y-4">
      {/* Welcome header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-gray-800 normal-case">Welcome back, {firstName}! 👋</h1>
          <p className="text-xs text-gray-500 normal-case mt-0.5">Here's what's happening with your institution today.</p>
        </div>
        <div className="form-card flex items-center gap-2 py-2 px-3 w-fit">
          <Building2 size={16} className="text-brand-blue shrink-0" />
          <div>
            <div className="text-[10px] text-gray-400">Current Branch</div>
            <div className="text-xs font-bold text-gray-700">{user?.agenceNom || 'Siège'}</div>
          </div>
          <ChevronDown size={14} className="text-gray-400 ml-2" />
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <KpiCard icon={Wallet} color="#7c3aed" label="Total Deposits" value={stats?.totalDeposits} trend={sparkline('deposits')} />
        <KpiCard icon={ArrowLeftRight} color="#11fc82" label="Total Withdrawals" value={stats?.totalWithdrawals} trend={sparkline('withdrawals')} />
        <KpiCard icon={Users} color="#1E90FF" label="Total Clients" value={exec?.totalClients} trend={null} />
        <KpiCard icon={Landmark} color="#f59e0b" label="Outstanding Loans" value={loanDash?.totalOutstandingPrincipal} trend={null} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Left / main column */}
        <div className="xl:col-span-2 space-y-4">
          <div className="form-card">
            <div className="flex items-center justify-between mb-2">
              <div className="form-card-title mb-0">Collections Overview (14 derniers jours)</div>
            </div>
            <div style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => fmt(v)} />
                  <Bar dataKey="collections" name="Collectes" fill="#1E90FF" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="deposits" name="Dépôts" fill="#11fc82" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="form-card">
              <div className="form-card-title">Top Performing Clients</div>
              {loading ? <p className="text-xs text-gray-400 normal-case mt-2">Chargement…</p> : topClients.length === 0 ? (
                <p className="text-xs text-gray-400 normal-case mt-2">Aucune donnée.</p>
              ) : (
                <div className="mt-2 divide-y divide-gray-100">
                  {topClients.map((c, i) => (
                    <div key={c.clientID} className="flex items-center justify-between py-2 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-brand-blue/10 text-brand-blue font-bold flex items-center justify-center text-[10px] shrink-0">{i + 1}</span>
                        <span className="font-semibold text-gray-700 truncate">{c.clientName}</span>
                      </div>
                      <span className="font-bold text-gray-800 shrink-0">{fmt(c.totalBalance)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="form-card">
              <div className="form-card-title">Branch Performance</div>
              {agencies.length === 0 ? <p className="text-xs text-gray-400 normal-case mt-2">Aucune donnée.</p> : (
                <div className="mt-2 divide-y divide-gray-100">
                  {agencies.map((a) => (
                    <div key={a.agenceID} className="flex items-center justify-between py-2 text-xs">
                      <span className="font-semibold text-gray-700 truncate">{a.nom}</span>
                      <span className="text-gray-500">{a.clientCount} clients</span>
                      <span className="font-bold text-gray-800">{fmt(a.collections + a.deposits)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <div className="form-card">
            <div className="form-card-title">Quick Actions</div>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {QUICK_ACTIONS.map((a) => (
                <button
                  key={a.label}
                  onClick={() => navigate(a.to)}
                  className="flex flex-col items-center gap-1.5 p-2.5 rounded-lg border border-gray-100 hover:border-brand-blue/40 hover:bg-brand-blue/5 transition"
                >
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${a.color}18` }}>
                    <a.icon size={16} style={{ color: a.color }} />
                  </div>
                  <span className="text-[10px] font-semibold text-gray-600 text-center leading-tight">{a.label}</span>
                </button>
              ))}
            </div>
          </div>

          {mixData.length > 0 && (
            <div className="form-card">
              <div className="form-card-title">Transaction Mix (aujourd'hui)</div>
              <div style={{ height: 180 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={mixData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={70} paddingAngle={2}>
                      {mixData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => fmt(v)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-1.5 mt-1">
                {mixData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-1.5 text-[10px]">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-gray-500 truncate">{d.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="form-card">
            <div className="form-card-title">Recent Activity</div>
            {notifications.length === 0 ? (
              <p className="text-xs text-gray-400 normal-case mt-2">Aucune notification récente.</p>
            ) : (
              <div className="mt-2 divide-y divide-gray-100">
                {notifications.map((n) => (
                  <div key={n.notificationID} className="flex items-start gap-2 py-2">
                    {n.severity === 'ALERT' ? <AlertTriangle size={14} className="text-red-500 mt-0.5 shrink-0" /> :
                      n.severity === 'WARNING' ? <Bell size={14} className="text-amber-500 mt-0.5 shrink-0" /> :
                        <Info size={14} className="text-brand-blue mt-0.5 shrink-0" />}
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-gray-700 truncate">{n.title}</div>
                      <div className="text-[11px] text-gray-500 normal-case line-clamp-2">{n.message}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
