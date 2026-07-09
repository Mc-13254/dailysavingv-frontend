import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Users, UserCog, Building2, Landmark, Wallet, AlertCircle } from 'lucide-react';
import { ReportsAPI } from '../api/endpoints';

const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n || 0);

function Card({ icon: Icon, label, value, accent, sub }) {
  return (
    <div className="form-card flex items-center gap-3">
      <div className="w-11 h-11 rounded-lg bg-blue-50 text-brand-blue flex items-center justify-center shrink-0"><Icon size={20} /></div>
      <div className="min-w-0">
        <div className="text-xs text-gray-400">{label}</div>
        <div className={`text-xl font-bold truncate ${accent ? 'text-brand-blue' : ''}`}>{value}</div>
        {sub && <div className="text-[11px] text-gray-400">{sub}</div>}
      </div>
    </div>
  );
}

export default function ExecutiveDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    ReportsAPI.executive()
      .then(({ data }) => setData(data))
      .catch((err) => setError(err?.response?.data?.message || err?.response?.data?.title || "Échec du chargement du tableau de bord exécutif."));
  }, []);

  if (error) return (
    <div className="panel">
      <div className="error-banner">{error}</div>
    </div>
  );
  if (!data) return <div className="panel"><div className="empty-state">Chargement du tableau de bord exécutif…</div></div>;

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <div className="panel-title">Executive Dashboard</div>
          <div className="panel-subtitle">Vue d'ensemble pour la Direction — revenus, portefeuille, prêts, trésorerie, performance des agences.</div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <Card icon={TrendingUp} label="Chiffre d'affaires (collectes+dépôts)" value={fmt(data.totalRevenue)} accent />
        <Card icon={data.netCashFlow >= 0 ? TrendingUp : TrendingDown} label="Flux net de trésorerie" value={fmt(data.netCashFlow)} />
        <Card icon={Wallet} label="Position de trésorerie (coffres)" value={fmt(data.vaultCashPosition)} />
        <Card icon={TrendingUp} label="Commission totale" value={fmt(data.totalCommission)} />

        <Card icon={Users} label="Clients actifs" value={fmt(data.totalClients)} />
        <Card icon={UserCog} label="Collecteurs actifs" value={fmt(data.totalCollectors)} />
        <Card icon={Building2} label="Agences" value={fmt(data.totalAgencies)} />
        <Card icon={AlertCircle} label="En attente de validation" value={fmt(data.pendingValidations)} />

        <Card icon={Landmark} label="Encours de prêts" value={fmt(data.totalLoansOutstanding)} sub={`${data.activeLoans} prêt(s) actif(s)`} />
        <Card icon={TrendingUp} label="Collectes aujourd'hui" value={fmt(data.totalCollectionsToday)} />
        <Card icon={Wallet} label="Sessions de caisse ouvertes" value={fmt(data.openCashSessions)} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="form-card">
          <div className="form-card-title text-emerald-600">🏆 Meilleure agence</div>
          <div className="text-lg font-semibold mt-1">{data.topAgencyName || '—'}</div>
        </div>
        <div className="form-card">
          <div className="form-card-title text-red-600">⚠️ Agence la plus faible</div>
          <div className="text-lg font-semibold mt-1">{data.lowestAgencyName || '—'}</div>
        </div>
      </div>
    </div>
  );
}
