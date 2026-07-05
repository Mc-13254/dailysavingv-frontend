import { useEffect, useState } from 'react';
import { TransactionAPI } from '../api/endpoints';

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    TransactionAPI.dashboardSummary()
      .then(({ data }) => setSummary(data))
      .catch(() => setSummary({ totalTransactions: 0, totalMontant: 0, totalCommission: 0 }))
      .finally(() => setLoading(false));
  }, []);

  const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n || 0);

  return (
    <div>
      <div className="panel-title" style={{ marginBottom: 16 }}>Tableau de bord</div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">Transactions aujourd'hui</div>
          <div className="kpi-value">{loading ? '—' : fmt(summary?.totalTransactions)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Montant total (XAF)</div>
          <div className="kpi-value">{loading ? '—' : fmt(summary?.totalMontant)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Commissions générées (XAF)</div>
          <div className="kpi-value accent">{loading ? '—' : fmt(summary?.totalCommission)}</div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <div>
            <div className="panel-title">Bienvenue</div>
            <div className="panel-subtitle">
              Les données affichées dans chaque module sont automatiquement filtrées
              selon l'agence de votre compte connecté.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
